# GitHub and publishing – English

The public project contains source for the native app, Pi gateway/agent, relay and installers, plus tests, documentation, licenses and approved image assets. Exclude private configuration, pairing keys, original PLC projects and personal photos.

1. Sign into your GitHub account and create a public repository such as `drevos-app`.
2. Upload/push the project, respecting `.gitignore`. Do not include `node_modules`, build outputs or private files.
3. Select **Actions → Drevos App → Run workflow**. Enable `build_ios` for an additional unsigned iPhone build.
4. Download artifacts only after successful checks. Clearly label the Android preview APK and **unsigned** iPhone IPA. Actions artifacts expire after 14 days.
5. For durable distribution, create a preview release with verified binaries, source package, license texts and SHA-256 checksums. Carry over actual tests/limitations from `docs/VALIDATION.md`; a preview is not a validated production product.

A GitHub repository is not a relay host. The operator must deploy the [relay](../cloud/README.md) once and put its real public base URL in `cloud/endpoint.json`. That URL is public; device keys and pairing codes are private.

## Signing and updates

The supplied application IDs are `at.eignerth.drevos`. Before publishing a fork, choose your own IDs and persistent private signing key. Android preview builds use a test signature. iPhone installation needs personal or regular Apple signing; an unsigned IPA cannot be installed directly.

Store listings, developer accounts, agreements, privacy disclosures and review are separate publishing steps. The app may be free for users while the operator still has hosting/store expenses. These files create no paid account or subscription.

Update native versions/build numbers and validation records with each release. Gateway/relay protocols are versioned; changes to registers, cryptography or command handling require appropriate tests. Preserve existing private configuration during updates.

## Licensing and brand

Original source is MIT. Dependencies retain their own conditions and available notices accompany the app package. The supplied Drevos logo and trademark rights are excluded from MIT. Manufacturer approval for public branding or store distribution is not implied; see `mobile/BRAND-NOTICE.md`.
