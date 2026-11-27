package at.eignerth.drevos.companion

import android.content.Context
import android.content.pm.PackageManager
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import com.google.android.gms.wearable.MessageEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import org.json.JSONObject
import java.io.File
import java.net.URI
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private const val PAIR_PATH = "/drevos/pairing/v1"
private const val ALIAS = "drevos.watch.pairing.v1"
private fun isWatch(context: Context) = context.packageManager.hasSystemFeature(PackageManager.FEATURE_WATCH)

private fun validated(json: String): String {
  require(json.length <= 4096)
  val s = JSONObject(json)
  val u = URI(s.getString("url"))
  require(u.scheme == "https" && !u.host.isNullOrBlank() && u.userInfo == null && u.query == null && u.fragment == null && u.path in listOf("", "/"))
  val cloud = s.getJSONObject("cloud")
  require(s.getString("token").matches(Regex("[a-f0-9]{64}")))
  require(s.getString("gatewayId").matches(Regex("[-\\w]{8,64}")))
  require(s.getString("language") in listOf("de", "en"))
  require(cloud.getString("room").matches(Regex("[a-f0-9]{32}")))
  require(cloud.getString("key").matches(Regex("[a-f0-9]{64}")))
  return JSONObject().put("url",s.getString("url")).put("token",s.getString("token"))
    .put("gatewayId",s.getString("gatewayId")).put("language",s.getString("language"))
    .put("cloud",JSONObject().put("room",cloud.getString("room")).put("key",cloud.getString("key"))).toString()
}

internal object PairingVault {
  private fun file(context: Context) = File(context.noBackupFilesDir,"drevos-watch-session.enc")
  private fun key(): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (store.getKey(ALIAS,null) as? SecretKey)?.let { return it }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore").apply {
      init(KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
    }.generateKey()
  }
  @Synchronized fun save(context: Context, json: String) {
    val content=validated(json).toByteArray(Charsets.UTF_8)
    val cipher=Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE,key()) }
    val data=cipher.iv+cipher.doFinal(content)
    require(cipher.iv.size==12)
    val target=file(context);val temp=File(context.noBackupFilesDir,"drevos-watch-session.pending")
    temp.outputStream().use { it.write(data);it.flush() }
    check(temp.renameTo(target))
  }
  @Synchronized fun load(context: Context):String? {
    val target=file(context);if(!target.exists())return null
    val data=target.readBytes();require(data.size in 29..8192)
    val cipher=Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,data.copyOfRange(0,12))) }
    return validated(String(cipher.doFinal(data.copyOfRange(12,data.size)),Charsets.UTF_8))
  }
  @Synchronized fun clear(context: Context) {
    val target=file(context);if(target.exists())check(target.delete())
    val store=KeyStore.getInstance("AndroidKeyStore").apply { load(null) };store.deleteEntry(ALIAS)
  }
}

class PairingService: WearableListenerService() {
  override fun onMessageReceived(event:MessageEvent) {
    // Data Layer authenticates matching package names and signing certificates.
    if(event.path!=PAIR_PATH || !isWatch(this) || event.data.size>4096)return
    try { PairingVault.save(this,String(event.data,Charsets.UTF_8)) } catch(_:Exception) { /* Never log credentials. */ }
  }
}

class DrevosCompanionModule: Module() {
  override fun definition()=ModuleDefinition {
    Name("DrevosCompanion")
    Function("isWatch") { appContext.reactContext?.let { isWatch(it) }?:false }
    AsyncFunction("getPeers") { promise:Promise ->
      val context=appContext.reactContext
      if(context==null){promise.reject("unavailable","App unavailable",null);return@AsyncFunction}
      Wearable.getNodeClient(context).connectedNodes.addOnSuccessListener { nodes ->
        promise.resolve(nodes.map { mapOf("id" to it.id,"name" to it.displayName) })
      }.addOnFailureListener { promise.reject("unavailable","No watch available",null) }
    }
    AsyncFunction("sendSession") { node:String,json:String,promise:Promise ->
      val context=appContext.reactContext
      if(context==null || isWatch(context)){promise.reject("unavailable","Phone required",null);return@AsyncFunction}
      val safe=try { validated(json) } catch(_:Exception) { promise.reject("invalid","Cloud pairing required",null);return@AsyncFunction }
      Wearable.getNodeClient(context).connectedNodes.addOnSuccessListener { peers ->
        if(peers.none { it.id==node }){promise.reject("unavailable","Watch disconnected",null);return@addOnSuccessListener}
        Wearable.getMessageClient(context).sendMessage(node,PAIR_PATH,safe.toByteArray(Charsets.UTF_8))
          .addOnSuccessListener { promise.resolve(true) }.addOnFailureListener { promise.reject("unavailable","Pairing not delivered",null) }
      }.addOnFailureListener { promise.reject("unavailable","Watch disconnected",null) }
    }
    AsyncFunction("loadWatchSession") { appContext.reactContext?.let { if(isWatch(it)) PairingVault.load(it) else null } }
    AsyncFunction("clearWatchSession") { appContext.reactContext?.let { if(isWatch(it))PairingVault.clear(it) } }
    AsyncFunction("publishSnapshot") { _:String -> Unit }
    AsyncFunction("configureCarAccess") { json:String ->
      val context=appContext.reactContext ?: error("App unavailable")
      check(!isWatch(context));PairingVault.save(context,json)
    }
    AsyncFunction("clearCarAccess") {
      appContext.reactContext?.let { if(!isWatch(it))PairingVault.clear(it) }
    }
    AsyncFunction("startLiveActivity") { false }
    AsyncFunction("stopLiveActivity") { Unit }
  }
}
