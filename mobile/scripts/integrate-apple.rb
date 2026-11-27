require 'xcodeproj'
require 'fileutils'
require 'json'

root=File.expand_path('..',__dir__)
project_path=File.join(root,'ios','Drevos.xcodeproj')
project=Xcodeproj::Project.open(project_path)
phone=project.targets.find{|t|t.name=='Drevos'} or abort 'Drevos phone target missing'
version=JSON.parse(File.read(File.join(root,'app.json')))['expo']['version']
build=JSON.parse(File.read(File.join(root,'app.json')))['expo']['ios']['buildNumber']

def target(project,name,type,platform,deployment,bundle,plist)
  t=project.targets.find{|x|x.name==name} || project.new_target(type,name,platform,deployment)
  t.build_configurations.each do |config|
    s=config.build_settings
    s['PRODUCT_NAME']=name
    s['PRODUCT_BUNDLE_IDENTIFIER']=bundle
    s['INFOPLIST_FILE']=plist
    s['GENERATE_INFOPLIST_FILE']='NO'
    s['SWIFT_VERSION']='5.0'
    s['CODE_SIGN_STYLE']='Automatic'
    s['SKIP_INSTALL']='YES'
    s['TARGETED_DEVICE_FAMILY']=platform==:watchos ? '4' : '1,2'
    s['ENABLE_USER_SCRIPT_SANDBOXING']='NO'
  end
  t.product_name=name
  t
end
def add_sources(project,target,paths)
  group=project.main_group.find_subpath(target.name,true)
  paths.each do |path|
    ref=group.files.find{|f|f.path==path} || group.new_file(path)
    target.add_file_references([ref]) unless target.source_build_phase.files_references.include?(ref)
  end
end
def embed(parent,child,name,path,folder)
  parent.add_dependency(child) unless parent.dependencies.any?{|d|d.target==child}
  phase=parent.copy_files_build_phases.find{|p|p.name==name} || parent.new_copy_files_build_phase(name)
  phase.dst_path=path;phase.dst_subfolder_spec=folder
  unless phase.files_references.include?(child.product_reference)
    entry=phase.add_file_reference(child.product_reference)
    entry.settings={'ATTRIBUTES'=>['RemoveHeadersOnCopy']}
  end
end
watch_dir=File.join(root,'ios','DrevosWatch')
widget_dir=File.join(root,'ios','DrevosLiveActivity')
FileUtils.mkdir_p([watch_dir,widget_dir])
# Xcodeproj writes plist files directly, without shell interpolation.
Xcodeproj::Plist.write_to_path({
  'CFBundleDisplayName'=>'Drevos','CFBundleIdentifier'=>'$(PRODUCT_BUNDLE_IDENTIFIER)',
  'CFBundleName'=>'$(PRODUCT_NAME)','CFBundleExecutable'=>'$(EXECUTABLE_NAME)',
  'CFBundlePackageType'=>'APPL','CFBundleShortVersionString'=>version,'CFBundleVersion'=>build,
  'WKApplication'=>true,'WKCompanionAppBundleIdentifier'=>'at.eignerth.drevos',
  'WKWatchOnly'=>false,'ITSAppUsesNonExemptEncryption'=>false
},File.join(watch_dir,'Info.plist'))
Xcodeproj::Plist.write_to_path({
  'CFBundleDisplayName'=>'Drevos Status','CFBundleIdentifier'=>'$(PRODUCT_BUNDLE_IDENTIFIER)',
  'CFBundleName'=>'$(PRODUCT_NAME)','CFBundleExecutable'=>'$(EXECUTABLE_NAME)',
  'CFBundlePackageType'=>'XPC!','CFBundleShortVersionString'=>version,'CFBundleVersion'=>build,
  'NSExtension'=>{'NSExtensionPointIdentifier'=>'com.apple.widgetkit-extension'}
},File.join(widget_dir,'Info.plist'))
watch=target(project,'DrevosWatch',:watch2_app,:watchos,'8.0','at.eignerth.drevos.watchkitapp','DrevosWatch/Info.plist')
watch.product_type='com.apple.product-type.application'
watch.build_configurations.each do |c|
  c.build_settings['SDKROOT']='watchos'
  c.build_settings['SUPPORTED_PLATFORMS']='watchos watchsimulator'
  c.build_settings['WATCHOS_DEPLOYMENT_TARGET']='8.0'
  c.build_settings['ASSETCATALOG_COMPILER_APPICON_NAME']='AppIcon'
end
add_sources(project,watch,Dir[File.join(root,'apple','Watch','*.swift')])
assets=File.join(watch_dir,'Assets.xcassets','AppIcon.appiconset')
FileUtils.mkdir_p(assets)
FileUtils.cp(File.join(root,'assets','app-icon.png'),File.join(assets,'AppIcon.png'))
File.write(File.join(assets,'Contents.json'),JSON.pretty_generate({'images'=>[{'filename'=>'AppIcon.png','idiom'=>'universal','platform'=>'watchos','size'=>'1024x1024'}],'info'=>{'author'=>'xcode','version'=>1}}))
asset_ref=project.main_group.find_subpath('DrevosWatch',true).files.find{|f|f.path==File.join(watch_dir,'Assets.xcassets')} || project.main_group.find_subpath('DrevosWatch',true).new_file(File.join(watch_dir,'Assets.xcassets'))
watch.resources_build_phase.add_file_reference(asset_ref) unless watch.resources_build_phase.files_references.include?(asset_ref)
embed(phone,watch,'Embed Watch Content','$(CONTENTS_FOLDER_PATH)/Watch','16')

widget=target(project,'DrevosLiveActivity',:app_extension,:ios,'18.0','at.eignerth.drevos.liveactivity','DrevosLiveActivity/Info.plist')
widget.build_configurations.each{|c|c.build_settings['APPLICATION_EXTENSION_API_ONLY']='YES';c.build_settings['IPHONEOS_DEPLOYMENT_TARGET']='18.0'}
add_sources(project,widget,[File.join(root,'apple','LiveActivity','DrevosLiveActivity.swift'),File.join(root,'modules','drevos-companion','ios','DrevosActivityAttributes.swift')])
embed(phone,widget,'Embed App Extensions','','13')
[watch,widget].each do |t|
  t.build_configurations.each do |c|
    c.build_settings['MARKETING_VERSION']=version;c.build_settings['CURRENT_PROJECT_VERSION']=build
    team=phone.build_configurations.find{|p|p.name==c.name}&.build_settings&.fetch('DEVELOPMENT_TEAM',nil)
    c.build_settings['DEVELOPMENT_TEAM']=team if team
  end
end
project.save
puts 'Drevos Watch (watchOS 8+) and Live Activity targets integrated.'
