package at.eignerth.drevos.companion

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.car.app.CarAppService
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.validation.HostValidator
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.Pane
import androidx.car.app.model.PaneTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class DrevosCarService:CarAppService(){
  override fun createHostValidator():HostValidator=HostValidator.Builder(this).addAllowedHosts(androidx.car.app.R.array.hosts_allowlist_sample).build()
  override fun onCreateSession():Session=object:Session(){override fun onCreateScreen(intent:Intent):Screen=DrevosCarScreen(carContext)}
}
private class DrevosCarScreen(context:CarContext):Screen(context),DefaultLifecycleObserver {
  private val handler=Handler(Looper.getMainLooper())
  private val executor=Executors.newSingleThreadExecutor()
  private val reader=CarCloudReader()
  private val busy=AtomicBoolean(false)
  private var started=false
  private var nextRead=0L
  private var snapshot:JSONObject?=null
  private val poll=object:Runnable {override fun run(){if(started){val now=SystemClock.elapsedRealtime();if(now>=nextRead){nextRead=now+5000;refresh()};invalidate();handler.postDelayed(this,1000)}}}
  init{lifecycle.addObserver(this)}
  override fun onStart(owner:LifecycleOwner){started=true;handler.post(poll)}
  override fun onStop(owner:LifecycleOwner){started=false;handler.removeCallbacks(poll);reader.cancel()}
  override fun onDestroy(owner:LifecycleOwner){started=false;handler.removeCallbacks(poll);reader.cancel();executor.shutdownNow()}
  private fun refresh(){
    if(!started || !busy.compareAndSet(false,true))return
    executor.execute{
      var result:JSONObject?=null
      try{val session=PairingVault.load(carContext);if(session!=null){result=reader.read(session);if(PairingVault.load(carContext)!=session)result=null}}catch(_:Exception){result=null}
      handler.post{busy.set(false);if(started){snapshot=result;invalidate()}}
    }
  }
  override fun onGetTemplate():Template {
    val pane=Pane.Builder()
    val current=snapshot
    val age=System.currentTimeMillis()-(current?.optLong("observedAt")?:0)
    val enabled=try{PairingVault.load(carContext)!=null}catch(_:Exception){false}
    if(enabled && current!=null && age in 0..15000){
      fun number(key:String)=String.format(java.util.Locale.ROOT,"%.1f",current.getDouble(key))
      pane.addRow(Row.Builder().setTitle("Kammer / Chamber").addText(number("chamber")+" "+current.getString("unit")).build())
      pane.addRow(Row.Builder().setTitle("Kern / Core").addText(number("core")+" "+current.getString("unit")).build())
      pane.addRow(Row.Builder().setTitle("Rauch / Smoke").addText(number("smoke")+" %").build())
      pane.addRow(Row.Builder().setTitle("Restzeit / Remaining").addText(current.getString("remaining")).build())
    }else{
      pane.addRow(Row.Builder().setTitle("Nicht verfügbar / Unavailable").addText(if(enabled)"Keine aktuellen Messwerte / No current readings" else "In Drevos am Handy unter Info Android Auto aktivieren / Enable Android Auto in phone app Info").build())
    }
    val actions=ActionStrip.Builder().addAction(Action.Builder().setTitle("Aktualisieren / Refresh").setOnClickListener{refresh()}.build()).build()
    return PaneTemplate.Builder(pane.build()).setTitle("Drevos").setHeaderAction(Action.APP_ICON).setActionStrip(actions).build()
  }
}
