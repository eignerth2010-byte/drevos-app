Pod::Spec.new do |s|
  s.name = 'DrevosCompanion'
  s.version = '0.6.0'
  s.summary = 'Drevos watch pairing and Live Activity bridge'
  s.description = s.summary
  s.author = 'Thomas Eigner'
  s.homepage = 'https://github.com/eignerth2010-byte/drevos-app'
  s.license = { :type => 'SEE LICENSE IN LICENSE' }
  s.source = { :git => s.homepage }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.0'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
