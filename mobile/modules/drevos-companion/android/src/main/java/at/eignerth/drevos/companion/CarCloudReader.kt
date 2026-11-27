package at.eignerth.drevos.companion

import android.util.Base64
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.io.IOException
import java.net.URI
import java.security.SecureRandom
import java.util.UUID
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/** Read-only native transport for Android Auto; it cannot prepare/execute commands. */
internal class CarCloudReader {
  companion object {private val http=OkHttpClient.Builder().connectTimeout(8,TimeUnit.SECONDS).readTimeout(0,TimeUnit.SECONDS).build()}
  @Volatile private var socket:WebSocket?=null
  fun cancel(){socket?.cancel();socket=null}
  fun read(json:String):JSONObject {
    val session=JSONObject(json);val cloud=session.getJSONObject("cloud")
    val room=cloud.getString("room");val keyHex=cloud.getString("key")
    require(keyHex.matches(Regex("[a-f0-9]{64}")) && room.matches(Regex("[a-f0-9]{32}")))
    val parts=URI(session.getString("url"));require(parts.scheme=="https" && parts.host!=null && parts.userInfo==null && parts.query==null && parts.fragment==null)
    val key=SecretKeySpec(keyHex.chunked(2).map{it.toInt(16).toByte()}.toByteArray(),"AES")
    val messages=LinkedBlockingQueue<Any>(64)
    val ws=http.newWebSocket(Request.Builder().url(session.getString("url").trimEnd('/').replaceFirst("https://","wss://")+"/v1/rooms/$room/socket").build(),object:WebSocketListener(){
      override fun onOpen(webSocket:WebSocket,response:Response){webSocket.send(JSONObject().put("type","hello").put("role","app").put("auth",session.getString("token")).toString())}
      override fun onMessage(webSocket:WebSocket,text:String){if(text.length>32768 || !messages.offer(text)){webSocket.cancel()}}
      override fun onFailure(webSocket:WebSocket,t:Throwable,response:Response?){messages.offer(IOException("Connection unavailable"))}
      override fun onClosed(webSocket:WebSocket,code:Int,reason:String){messages.offer(IOException("Connection closed"))}
    })
    socket=ws;val deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(12)
    fun frame():JSONObject {
      val left=deadline-System.nanoTime();if(left<=0)throw IOException("Read timeout")
      val value=messages.poll(left,TimeUnit.NANOSECONDS)?:throw IOException("Read timeout")
      if(value !is String)throw IOException("Connection unavailable")
      return JSONObject(value)
    }
    fun encrypt(body:JSONObject):String {
      val nonce=ByteArray(12).also{SecureRandom().nextBytes(it)}
      val cipher=Cipher.getInstance("AES/GCM/NoPadding").apply{init(Cipher.ENCRYPT_MODE,key,GCMParameterSpec(128,nonce));updateAAD("drevos-cloud:1:$room:app-to-pi".toByteArray(Charsets.UTF_8))}
      return JSONObject().put("v",1).put("n",Base64.encodeToString(nonce,Base64.NO_WRAP)).put("c",Base64.encodeToString(cipher.doFinal(body.toString().toByteArray(Charsets.UTF_8)),Base64.NO_WRAP)).toString()
    }
    fun decrypt(text:String):JSONObject {
      require(text.length<=30000);val p=JSONObject(text);require(p.getInt("v")==1)
      val nonce=Base64.decode(p.getString("n"),Base64.DEFAULT);val ciphertext=Base64.decode(p.getString("c"),Base64.DEFAULT)
      require(nonce.size==12 && ciphertext.size in 16..18000)
      val cipher=Cipher.getInstance("AES/GCM/NoPadding").apply{init(Cipher.DECRYPT_MODE,key,GCMParameterSpec(128,nonce));updateAAD("drevos-cloud:1:$room:pi-to-app".toByteArray(Charsets.UTF_8))}
      return JSONObject(String(cipher.doFinal(ciphertext),Charsets.UTF_8))
    }
    val client=UUID.randomUUID().toString().replace("-","");var boot:String?=null
    fun readResource(resource:String):JSONObject {
      require(resource in listOf("info","state"))
      val id=UUID.randomUUID().toString().replace("-","")
      val body=JSONObject().put("type","read").put("resource",resource).put("id",id).put("client",client)
      boot?.let{body.put("boot",it)}
      check(ws.send(JSONObject().put("type","data").put("payload",encrypt(body)).toString()))
      repeat(128){
        val f=frame();if(f.optString("type")=="offline")throw IOException("Offline")
        if(f.optString("type")=="data"){
          val reply=try{decrypt(f.getString("payload"))}catch(_:Exception){null}
          if(reply!=null && reply.optString("id")==id && reply.optString("client")==client){
            require(reply.opt("ok")==true);boot=reply.getString("boot");return reply.getJSONObject("result")
          }
        }
      }
      throw IOException("No matching response")
    }
    try {
      var ready=false
      repeat(32){if(!ready){val f=frame();if(f.optString("type")=="ready"){require(f.opt("deviceOnline")==true);ready=true}}}
      require(ready)
      val info=readResource("info")
      require(info.getString("id")==session.getString("gatewayId") && info.getInt("api_version")==1 && info.getString("profile")=="drevos_fx3u_v1")
      val state=readResource("state")
      require(state.opt("available") is Boolean)
      if(state.getBoolean("available")!=true)throw IOException("Offline")
      require(state.opt("fahrenheit") is Boolean)
      val result=JSONObject().put("observedAt",System.currentTimeMillis()).put("unit",if(state.getBoolean("fahrenheit"))"°F" else "°C")
      for((target,source) in mapOf("chamber" to "kammertemperatur","core" to "kerntemperatur","smoke" to "raucheinstellung")){
        val n=state.opt(source);require(n is Number && n.toDouble().isFinite());result.put(target,n)
      }
      val timer=state.getString("timer_restzeit");require(timer.length<=20 && timer.matches(Regex("[0-9]+:[0-5][0-9]:[0-5][0-9]")))
      return result.put("remaining",timer)
    }finally{ws.close(1000,"Done");socket=null}
  }
}
