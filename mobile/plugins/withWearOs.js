const {withAndroidManifest}=require('@expo/config-plugins');
module.exports=function withWearOs(config){
  if(process.env.DREVOS_WEAR_OS!=='1')return config;
  return withAndroidManifest(config,c=>{
    const m=c.modResults.manifest;
    m['uses-feature']=(m['uses-feature']??[]).filter(f=>f.$?.['android:name']!=='android.hardware.type.watch');
    m['uses-feature'].push({$: {'android:name':'android.hardware.type.watch','android:required':'true'}});
    m['uses-permission']=(m['uses-permission']??[]).filter(p=>p.$?.['android:name']!=='android.permission.CAMERA');
    m['uses-permission'].push({$: {'android:name':'android.permission.CAMERA','tools:node':'remove'}});
    const app=m.application[0];app['meta-data']=(app['meta-data']??[]).filter(x=>x.$?.['android:name']!=='com.google.android.wearable.standalone');
    app['service']=[...(app['service']??[]),{$:{'android:name':'at.eignerth.drevos.companion.DrevosCarService','tools:node':'remove'}}];
    app['meta-data'].push({$:{'android:name':'com.google.android.gms.car.application','tools:node':'remove'}},{$:{'android:name':'androidx.car.app.minCarApiLevel','tools:node':'remove'}});
    app['meta-data'].push({$: {'android:name':'com.google.android.wearable.standalone','android:value':'true'}});
    return c;
  });
};
