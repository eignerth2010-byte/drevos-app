const configuration=require('./app.json');
module.exports=()=>{
  const c=JSON.parse(JSON.stringify(configuration.expo));
  c.plugins.push('./plugins/withWearOs');
  c.ios.infoPlist.NSSupportsLiveActivities=true;
  if(process.env.DREVOS_WEAR_OS==='1'){
    c.android.blockedPermissions.push('android.permission.CAMERA');
    const props=c.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-build-properties');
    props[1].android.minSdkVersion=30;
    props[1].android.usesCleartextTraffic=false;
  }
  return c;
};
