# [1.1.0](https://github.com/qubic/wallet-extension/compare/v1.0.0...v1.1.0) (2026-05-13)


### Bug Fixes

* **dapp:** enlarge approval popup so password input fits ([d1ff019](https://github.com/qubic/wallet-extension/commit/d1ff019bc0a056f257b19bef31411857b14f7c22))
* **lock:** keep wallets unlocked after onboarding ([b1564a1](https://github.com/qubic/wallet-extension/commit/b1564a14dde1b0012d48d36d4d74c0bd4885c2d6))
* **onboarding:** remove unused locale key and passphrase trim in vault import ([71c6233](https://github.com/qubic/wallet-extension/commit/71c6233a3a3edc104e3391357976da037d9118a2))
* **onboarding:** replace magic number with MIN_PASSPHRASE_LENGTH constant ([18be40d](https://github.com/qubic/wallet-extension/commit/18be40d41a46754ad799e951243a0cfb1f2c827a))
* **onboarding:** show seed validation error only after user types ([8cc2682](https://github.com/qubic/wallet-extension/commit/8cc26829bb27eb582dcaaa80bf328b65b8220586))
* **onboarding:** validate import passphrases earlier ([2efec4e](https://github.com/qubic/wallet-extension/commit/2efec4ee893e71f73a47492def9fe3049580c4cd))
* **passphrase:** extract validation helper and stop trimming before vault APIs ([da9e125](https://github.com/qubic/wallet-extension/commit/da9e1253ab7387c6f032eaaca26347c43982cc7e))
* remove the new password from import vault flow ([7580ae9](https://github.com/qubic/wallet-extension/commit/7580ae9ddbd578989d9ad444b657549af3f27865))
* **router:** avoid stale unlock redirect after onboarding ([1c2aee0](https://github.com/qubic/wallet-extension/commit/1c2aee0c3300648b24e19928749ee03de7fddc3a))
* **ui:** align account names and input spacing ([7d22a4d](https://github.com/qubic/wallet-extension/commit/7d22a4da0c3f6fdef5aa77969365bb1dae2ac157))
* **ui:** improve input field visibility in dark mode ([aa0edb0](https://github.com/qubic/wallet-extension/commit/aa0edb09a9fa73ea8bebff9c142709670426663b))
* **ui:** use PasswordInput for all password fields ([3997ab6](https://github.com/qubic/wallet-extension/commit/3997ab6c0bd968f1487c968d034bf7e73be6c818)), closes [#160](https://github.com/qubic/wallet-extension/issues/160)
* update localization from invalid password to invalid file or password ([c3906b6](https://github.com/qubic/wallet-extension/commit/c3906b65a8b62c66b8e88ad17e1f6a5f1c6ec82b))
* update reveal seed icon to match the web wallet ([ac34d6d](https://github.com/qubic/wallet-extension/commit/ac34d6d02d1de005eef8b7f62fa83639fa35ed47))


### Features

* removed unnecessary third step from import flow ([89090b0](https://github.com/qubic/wallet-extension/commit/89090b0f52cb22c6cce9fcac1b34c07f73a9d1dd))
* **ui:** auto-focus single-field forms ([e423f68](https://github.com/qubic/wallet-extension/commit/e423f685d0351313b20b18bdd2c69c58ddf8ffeb))

# 1.0.0 (2026-04-30)


### Bug Fixes

* **a11y:** use button for draggable account rows ([8201259](https://github.com/qubic/wallet-extension/commit/82012593401e1695b18eaf21812f6afa7d6d9f9f))
* **accounts:** avoid keeping vault passphrase in component state ([f8efe68](https://github.com/qubic/wallet-extension/commit/f8efe687d5418d0566d9404e327328f96d058651))
* **accounts:** base default name on existing account count ([3deb3b1](https://github.com/qubic/wallet-extension/commit/3deb3b1861d471be2a61c06c38e4180d684e2d13))
* **accounts:** block transfer actions for watch-only accounts ([798bb0d](https://github.com/qubic/wallet-extension/commit/798bb0d3da076efb3c353a9b0131ae50277be6ad))
* **accounts:** clear saved account order when last account is removed ([d1b5b21](https://github.com/qubic/wallet-extension/commit/d1b5b212f9c1ec7ec3ba15d7efdb930cc32b35e0))
* **accounts:** deduplicate name checks with shared helper and i18n errors ([2148e9b](https://github.com/qubic/wallet-extension/commit/2148e9bbc54916277be29cd1fcd400c50fe6175f))
* **accounts:** default new address name to Account <n> ([71bdd2e](https://github.com/qubic/wallet-extension/commit/71bdd2e88fa848b6ebba7b2db2198bac271e68be))
* **accounts:** emit updates for cache/order mutations ([84c9042](https://github.com/qubic/wallet-extension/commit/84c90420931657f9750e85600564a76d4f9289bf))
* **accounts:** localize and parameterize suggested add-address names ([f4921c8](https://github.com/qubic/wallet-extension/commit/f4921c8807796702c74b828cde798df9f055f22a))
* **accounts:** move add-account button to header in manage accounts and popover ([0559284](https://github.com/qubic/wallet-extension/commit/05592849a65db1aa5e9838d82ab56f7cae621833))
* **accounts:** navigate to home when selecting account in manage accounts ([69ea97b](https://github.com/qubic/wallet-extension/commit/69ea97ba1617f45fc2ddeebd75a44b5418608440))
* **accounts:** populate account cache on vault import and unlock ([15b7167](https://github.com/qubic/wallet-extension/commit/15b716796482717ca30556f6de9a5bca1e43c9c0))
* **accounts:** prevent removing the last wallet account ([e35f29a](https://github.com/qubic/wallet-extension/commit/e35f29a57d3e792a2806e14880f0c833ee3d6e38))
* **accounts:** resolve manage accounts lint ([12d572c](https://github.com/qubic/wallet-extension/commit/12d572c379a93b5d5fa426abf1cfeabf66428298))
* **accounts:** return create-account flow to manage accounts ([19832c9](https://github.com/qubic/wallet-extension/commit/19832c9d6db5a786459214beef1ae3156b11be92))
* **accounts:** set newly created account as active after vault creation ([241d680](https://github.com/qubic/wallet-extension/commit/241d68029280cd3c74e2b1a8162db37d6be0c34c))
* **accounts:** show rename validation inside drawer ([dba9a41](https://github.com/qubic/wallet-extension/commit/dba9a41e11285efd9c601242328411faef478f45))
* **accounts:** sync active account state instantly across screens ([76ab284](https://github.com/qubic/wallet-extension/commit/76ab284b5a38e2bade0e94da78dab4274ab10dfb))
* **accounts:** update header name when renaming active watch-only account ([be725b4](https://github.com/qubic/wallet-extension/commit/be725b4c79851ae98007eea8ca0cbbb30f18bc77))
* **accounts:** write renamed vault entry before deleting old one ([8c4ff18](https://github.com/qubic/wallet-extension/commit/8c4ff181f9c23436bce321f96673e5238698c975))
* add cleanup and error handling to seed QR effect ([8a099fb](https://github.com/qubic/wallet-extension/commit/8a099fb3f9199c2d649b3ed8219e4746b84b2ce8))
* add contrast to watch only account badge in case of light mode ([927ffb8](https://github.com/qubic/wallet-extension/commit/927ffb88100f620cefe79a6b1f14c2057206bfc4))
* add default_locale to dev manifest ([9e52463](https://github.com/qubic/wallet-extension/commit/9e524637d471bddc44cffd764d51d8e607c2d794))
* add navigation for invalid and failed trxs ([e8b5c29](https://github.com/qubic/wallet-extension/commit/e8b5c295a7a1a2b8ccaae01c72a2e6c683d229f5))
* add validation to prevent sending qus to the sender's address ([4a0dd9e](https://github.com/qubic/wallet-extension/commit/4a0dd9ee33a73a9a18ca3bbb72862d84ce653bc1))
* aggregate assets by token ([4690c4f](https://github.com/qubic/wallet-extension/commit/4690c4f57e9027e6136baa073ef456060a450ee4))
* aggregate assets by token in the transfer view ([cdbff4d](https://github.com/qubic/wallet-extension/commit/cdbff4dc9f709e120a049bde3cc1459e8911817b))
* append watch only accounts to the export vault ([#67](https://github.com/qubic/wallet-extension/issues/67)) ([c91c037](https://github.com/qubic/wallet-extension/commit/c91c0374b883a963550a847ea581a81465ba067a))
* **app:** resolve dev conflict and align rpc base url ([7844792](https://github.com/qubic/wallet-extension/commit/78447921cc5ac6bea601a231fe4ccddd84c439d7))
* **auth:** use shared vault access validation in passphrase drawer ([1341ccc](https://github.com/qubic/wallet-extension/commit/1341ccc295ccd2866a37a6796f68d1d01552d509))
* **checkbox:** improve border visibility in light and dark mode ([016d824](https://github.com/qubic/wallet-extension/commit/016d8242f4b5340a3e361ece7c98bb563ab6e780))
* **ci:** resolve version before build so dist contains correct version ([60a8eed](https://github.com/qubic/wallet-extension/commit/60a8eed4b339f985064b3506edb650931af3aaa2))
* **ci:** resolve version before build so dist contains correct version ([71a0fe7](https://github.com/qubic/wallet-extension/commit/71a0fe7e36dd9a49c34f2dec8500344549ecb451))
* clear the passphrase after usage ([0903ce5](https://github.com/qubic/wallet-extension/commit/0903ce5e99d65958fcbdfdd1469ef5a8b2fdd084))
* correct passphrase-auth identity lookup and deduplicate vault events ([b1affcc](https://github.com/qubic/wallet-extension/commit/b1affcc548bfb0addc3e4eab71f73f6fb114e325))
* **dapp:** address review findings in approval flow ([db3dacd](https://github.com/qubic/wallet-extension/commit/db3dacd71e9367e5e1b3cc5b39437ff0335964a8))
* **dapp:** apply biome formatting in content script ([47587d2](https://github.com/qubic/wallet-extension/commit/47587d2e7dd9c8c41f413728ef8b9f452a93a5c0))
* **dapp:** block signing flow for watch-only accounts ([bab3681](https://github.com/qubic/wallet-extension/commit/bab368177ca549f0d384f2bc0846491e83932184))
* **dapp:** bundle provider bridge as classic scripts ([eba8f12](https://github.com/qubic/wallet-extension/commit/eba8f12d8c9a98e6913f71fa6fd4cd0219df4d2b))
* **dapp:** deduplicate extension type declarations ([7ff6d54](https://github.com/qubic/wallet-extension/commit/7ff6d548d9cae9a6fc3046c7e98d46413de120a1))
* **dapp:** fail fast when approval window cannot be opened ([e4e5271](https://github.com/qubic/wallet-extension/commit/e4e52715af7dd022f5bb956cc4e599b3ae2cde0e))
* **dapp:** harden bridge and approval handling ([f374cc0](https://github.com/qubic/wallet-extension/commit/f374cc06ab08ac065406a74df529e3cb1fe0ddce))
* **dapp:** harden persisted approval payloads and replay handling ([5f3be90](https://github.com/qubic/wallet-extension/commit/5f3be90a65cfeb236fcb3295a12ec6bbf5f42763))
* **dapp:** improve approval popup and drawer behavior ([4a35956](https://github.com/qubic/wallet-extension/commit/4a359565143ec6d394e97dec9f7d96d449109536))
* **dapp:** improve signing approval passphrase handling ([55d7b38](https://github.com/qubic/wallet-extension/commit/55d7b38f04177def5401695cc7070d1f44d3015c))
* **dapp:** improve transaction approval UI ([163c092](https://github.com/qubic/wallet-extension/commit/163c092871d37033fd52879f55cf43a0997c5d72))
* **dapp:** limit web-accessible chunks for inpage provider ([6d3360f](https://github.com/qubic/wallet-extension/commit/6d3360f4dac5e88680192a6852aa1c3f5741ae92))
* **dapp:** only show target tick when explicitly assigned in request ([45cb257](https://github.com/qubic/wallet-extension/commit/45cb257874c7b295f151f8e5c2f8602658e2b7b5))
* **dapp:** persist inpage session across bridge reinjections ([e102cca](https://github.com/qubic/wallet-extension/commit/e102cca23b0d5c963f23159d19c077e2e8a43277))
* **dapp:** persist watch-only state for approvals ([5aee033](https://github.com/qubic/wallet-extension/commit/5aee033fab682dd31922c77647b654b4290ea6b8))
* **dapp:** preserve original connected timestamp on reconnect ([d4e48d4](https://github.com/qubic/wallet-extension/commit/d4e48d43c8bdc9bf65055925758f81d616110b59))
* **dapp:** require active account for connect ([ed22cd5](https://github.com/qubic/wallet-extension/commit/ed22cd534ac4dfc90750e4ddb821b4aa79a87fe3))
* **dapp:** resolve send tx tick on approval ([9768309](https://github.com/qubic/wallet-extension/commit/976830964357d3fade8bd7675acf1d93f9ca5acd))
* **dapp:** ship classic provider scripts for extension injection ([59805be](https://github.com/qubic/wallet-extension/commit/59805beb3be56810126c4b34d2a22dedfd5405be))
* **dapp:** strict numeric validation and tick-in-past rejection ([e82e740](https://github.com/qubic/wallet-extension/commit/e82e7404e870dd0fe1c0f67f77a3759f5b7afbf3))
* **dapp:** sync account snapshot and scope provider events ([1a2b4a7](https://github.com/qubic/wallet-extension/commit/1a2b4a7edc162cbfd840f52f1dbde9b8da5d6ffb))
* **dapp:** use shared rpc base url in app and controller ([e115622](https://github.com/qubic/wallet-extension/commit/e115622bdf4e2b949984f4248927d245fca90182))
* **dapp:** use sidepanel presence and accept popup approval decisions ([38c9e95](https://github.com/qubic/wallet-extension/commit/38c9e95521651241243c529a363849f4480c2ded))
* **dapp:** validate runtime payloads and limit pending approvals ([86bd9fc](https://github.com/qubic/wallet-extension/commit/86bd9fc4d43a0ab861010389286701e9edb6b58e))
* **dapp:** validate send tx self-send and balance before approval ([cdf7bc7](https://github.com/qubic/wallet-extension/commit/cdf7bc74cd5a0ca58bc23b8f03d0fcb06390d4f5))
* delete wallet function ([37a19d3](https://github.com/qubic/wallet-extension/commit/37a19d3722addd8ea4708c32137ec0a3b39fe4d5))
* disable continue button while asset data is loading ([39d200e](https://github.com/qubic/wallet-extension/commit/39d200e16283c9614c2614cc567b2ff44f351e23))
* **extension:** unify side panel toggle behavior ([0d8a708](https://github.com/qubic/wallet-extension/commit/0d8a70823f2c1f7a15ccd4d43f97f4c4e04c65e3))
* fix and centralize failed transactions logic ([a15c46d](https://github.com/qubic/wallet-extension/commit/a15c46dbc7e9fc13b041917f8c3920bfaa53d38f))
* fix button color hover contrast in dark mode ([5b5d466](https://github.com/qubic/wallet-extension/commit/5b5d46632a4810aceb377818739568d9554b6c7f))
* fix the drawer height overflow ([267d980](https://github.com/qubic/wallet-extension/commit/267d98018dcc9861d311828710d715734ff5a9c9))
* **header:** add scrollable account dropdown for long lists ([040996d](https://github.com/qubic/wallet-extension/commit/040996dfb2610500e41fb68fa0569dfa538733ab))
* **header:** align account dropdown balance with identity row ([f61f63b](https://github.com/qubic/wallet-extension/commit/f61f63bb8834993105fed9dd148b1203d4a59955))
* **header:** improve account selector and copy button placement ([2b3f71b](https://github.com/qubic/wallet-extension/commit/2b3f71ba8b1ba830820ca0e5e60cd70f2013e29b))
* **header:** remove passphrase prompt from account switching ([11eca2d](https://github.com/qubic/wallet-extension/commit/11eca2d29676cca7e154a5ec254616734ea02ea1))
* **header:** replace create account button with add account drawer trigger ([5f425bc](https://github.com/qubic/wallet-extension/commit/5f425bce501365453555a680cd6b951345c03edf))
* **header:** truncate long account names in header ([c98ead2](https://github.com/qubic/wallet-extension/commit/c98ead2d0ac8ac72295b3f3f695fead0d1e6bbac))
* **history:** align pagination and row cursor behavior ([2213b58](https://github.com/qubic/wallet-extension/commit/2213b585136b5e9e6f6305afe16d2f27041b5969))
* **history:** apply biome formatting for ci ([b12393d](https://github.com/qubic/wallet-extension/commit/b12393d5f550f231346a9c8562905fb20ce50d1d))
* **history:** memoize sorted transaction list derivation ([edf9120](https://github.com/qubic/wallet-extension/commit/edf9120e37ac24f498e0d616fa3600591fab3b5b))
* **history:** prevent infinite-scroll loop when sentinel stays visible ([d786a2b](https://github.com/qubic/wallet-extension/commit/d786a2b7c498e34bc596ebab2b8e601afa56eeb3))
* **history:** refresh transactions when active account changes ([eeb9955](https://github.com/qubic/wallet-extension/commit/eeb9955cc2aaa2c21aca0386be13b36571032040))
* **history:** reuse shared compact balance formatter ([86c0f86](https://github.com/qubic/wallet-extension/commit/86c0f8693f903eb91f55b9e403a0ae5d4ccb3b33))
* **history:** surface pending and failed transactions separately ([6450077](https://github.com/qubic/wallet-extension/commit/6450077696bb250a4b1fd913e1cc1400accbc6d6))
* **home:** add bQUBIC suffix and highlight price in primary color ([b89798d](https://github.com/qubic/wallet-extension/commit/b89798dd0328d5eb3080d386b54dc990653dec27))
* **home:** add compact view-all action in recent history ([f498a36](https://github.com/qubic/wallet-extension/commit/f498a36ab06720b75e298b755a872ae704943fba))
* **home:** center layout outside constrained extension views ([dfd62bb](https://github.com/qubic/wallet-extension/commit/dfd62bb732a2374888d0285e49eb1bd70caae618))
* **home:** debounce syncing badge to prevent rapid flicker ([28fd90c](https://github.com/qubic/wallet-extension/commit/28fd90c7ae44c5d2dbbaeb260de4bbf3778c8595))
* **home:** improve account-switch reload and balance rendering ([cd597e2](https://github.com/qubic/wallet-extension/commit/cd597e2c0b30aa1b2839eddbb72ba14ebca4907a))
* **home:** preserve transaction preview enhancements after split ([784d254](https://github.com/qubic/wallet-extension/commit/784d2543aff2b89815d2d401ad4fdfea75eef176))
* **home:** prevent assets overflow under bottom nav ([0a6df9d](https://github.com/qubic/wallet-extension/commit/0a6df9dab6aa73bfae32a09189f84b80e09a913e))
* **home:** remove amount background and format tick with separators ([7bfdca5](https://github.com/qubic/wallet-extension/commit/7bfdca5eedd2f2de8c2b7e616a8c59b3450fa36c))
* **home:** replace balance counting animation with subtle pulse ([96e5d19](https://github.com/qubic/wallet-extension/commit/96e5d199167aabdd941490db96b292420f745b9e))
* **i18n:** add missing accent in spanish last-account message ([1370ae3](https://github.com/qubic/wallet-extension/commit/1370ae3cf94c93fe821c1b428fd88f808b065ddc))
* **i18n:** add missing transfer.confirm.from key to all locales ([a7ff859](https://github.com/qubic/wallet-extension/commit/a7ff8590c5f1b5e9f11307c99e61e8dd493f9e3b))
* **i18n:** fix missing accent marks in Spanish translations ([a93eb45](https://github.com/qubic/wallet-extension/commit/a93eb45add24205144fc152883548a9fdf4f5c91))
* **i18n:** fix missing tildes in Spanish locale (contraseña) ([22fb232](https://github.com/qubic/wallet-extension/commit/22fb232db40480b02a78e2099c9e878f94c2ecd4))
* **i18n:** localize hardcoded strings and consolidate shared keys ([269fdaf](https://github.com/qubic/wallet-extension/commit/269fdafb2acb28a8d37aca118b5f067eae135b70))
* **i18n:** localize import-seed header and step label ([a69fcd2](https://github.com/qubic/wallet-extension/commit/a69fcd2ff36f5e6c9765da369ece76ca11318e01))
* **i18n:** remove orphaned txDetails.copyTxId and txDetails.refresh keys ([241a306](https://github.com/qubic/wallet-extension/commit/241a306f58bc1ab21ac8a17f49755c6775e77c5c))
* **i18n:** rename vault recipients label to "Your accounts" ([2059da8](https://github.com/qubic/wallet-extension/commit/2059da8b9fad9eaff6a33ad73c8184150fe71ef1))
* **i18n:** use existing tx details title key on transfer success ([eca9742](https://github.com/qubic/wallet-extension/commit/eca97421cb118bb276920652c2df438dd9e259a5))
* **import:** reject vault files exceeding 100 KB ([6bc5207](https://github.com/qubic/wallet-extension/commit/6bc5207fbdc71210fde315a404d2813ca112a243))
* **layout:** restore full-height wrappers for centered pages ([498af85](https://github.com/qubic/wallet-extension/commit/498af85b4e9b995e7cc1ef4f8a1aea1a62115be1))
* **layout:** stabilize popup sizing and shell scrolling ([a836f64](https://github.com/qubic/wallet-extension/commit/a836f6448331f582344d6cc45555d7971cd6d872))
* localize invalid identity checksum error in transfer ([#140](https://github.com/qubic/wallet-extension/issues/140)) ([b46081a](https://github.com/qubic/wallet-extension/commit/b46081ae21f66b9cdc362d1460dd3f0263681b33))
* **lock:** add fixed timeout presets and activity-based auto-lock ([9e8f865](https://github.com/qubic/wallet-extension/commit/9e8f86507294a33924dc3b9e3787203d41bb7744))
* **lock:** enforce browser-restart lock and set 15m default timeout ([67d6126](https://github.com/qubic/wallet-extension/commit/67d61263bb5f4cc5368047afc48c86ede968f863))
* **lock:** simplify timeout preset normalization fallback ([184eb63](https://github.com/qubic/wallet-extension/commit/184eb63dd39c15da917a6951a00b4eea0973bb48))
* make failed transactions clickable and show failed status hint ([d08a23d](https://github.com/qubic/wallet-extension/commit/d08a23def14774539e4d0b2225a11f26658a6a02))
* make the failed transaction appears on their correct order in the list no necessart at the top ([93ee4d8](https://github.com/qubic/wallet-extension/commit/93ee4d8ed23f47172fa0ac1f0d5c48dcb1e92955))
* make the nav bar fixed at bottom in macos chrome ([91c88e4](https://github.com/qubic/wallet-extension/commit/91c88e429a329dcf4f44dc6f75a998433e01db4b))
* **manifest:** prepare extension for Chrome Web Store submission ([#145](https://github.com/qubic/wallet-extension/issues/145)) ([1f57a19](https://github.com/qubic/wallet-extension/commit/1f57a197457b71f09de276e494ed52bed6588560))
* **nav:** hide transfer tab for watch-only accounts ([7877765](https://github.com/qubic/wallet-extension/commit/7877765e4741161748008d9dc6cccdf4c4b4cbf7))
* **onboarding:** add realtime private-seed validation ([8563d3b](https://github.com/qubic/wallet-extension/commit/8563d3b0d58b2d0c1bb3b9e190e9a54172107984))
* **onboarding:** improve seed warning contrast in dark mode ([1951ef1](https://github.com/qubic/wallet-extension/commit/1951ef15e75165600d548c11cf2738bd1e4f9946))
* **onboarding:** keep wallet unlocked after setup completion ([d0d6d29](https://github.com/qubic/wallet-extension/commit/d0d6d293117951a5b80e35ff553268954f9351dc))
* **pending:** address review blockers in failed transaction flow ([a7f7bb0](https://github.com/qubic/wallet-extension/commit/a7f7bb02f94e875d7d904a023e65660fccbb61e2))
* **pending:** extract resend eligibility and unify history row rendering ([23e08b9](https://github.com/qubic/wallet-extension/commit/23e08b980b1f669b3fc2a08c0f75349472305261))
* **pending:** persist pending tx and refresh caches after settlement ([87bceb7](https://github.com/qubic/wallet-extension/commit/87bceb777bab3f6682ffd80949a2001c0749ed50))
* **pending:** prevent pending transactions from being resolved prematurely ([55f425d](https://github.com/qubic/wallet-extension/commit/55f425d387b8943c25528ce947ed0ccb362ca74c))
* **pending:** remove failed entries on resend and allow manual delete ([4bfacf0](https://github.com/qubic/wallet-extension/commit/4bfacf0c6a290f22799d2a1ae68bce1a93bcf1cd))
* **pending:** track failed state and resolve by archiver tick ([54dd420](https://github.com/qubic/wallet-extension/commit/54dd420c0359e3d1ceb09bd455d8d5de4a8765e4))
* **popup:** restore explicit popup viewport sizing ([726ee3e](https://github.com/qubic/wallet-extension/commit/726ee3e6854066429a89fed59b4da7d01c803b63))
* prevent amount input text overlapping token label and Max button ([5824e2b](https://github.com/qubic/wallet-extension/commit/5824e2b0916004d131af4653e50990bd71f6a45b))
* prevent duplicate vault entries when renaming accounts ([#129](https://github.com/qubic/wallet-extension/issues/129)) ([979d984](https://github.com/qubic/wallet-extension/commit/979d984d2a738c1ad785d729548324357722e0c5))
* prevent submit before balance loading ([e8c7a88](https://github.com/qubic/wallet-extension/commit/e8c7a8803bfb428e737605a3c446f5e5c7a0fd7c))
* **rebase:** resolve post-rebase lint and type issues ([c4547a0](https://github.com/qubic/wallet-extension/commit/c4547a010a8122627ac2ebf746b953868041277d))
* **release:** show beta intro and install instructions only on beta releases ([819df2b](https://github.com/qubic/wallet-extension/commit/819df2b26105c3d1e11ec2370fc71ab55170369b))
* remove squeezing from icons if the transatcion row is taller ([12864bf](https://github.com/qubic/wallet-extension/commit/12864bf5cc7ef8390c6ae2db77f99b23cfb07438))
* remove tabular-nums from asset balances ([a65cdfc](https://github.com/qubic/wallet-extension/commit/a65cdfc5bd50e883769c6d66a1f6f40129d67415))
* remove unused failedHash query param from resend URLs ([2fc0fcc](https://github.com/qubic/wallet-extension/commit/2fc0fcc933d118e3fa5e6be88a9de4a1603444d8))
* resolve stuck failed pending transactions ([55b9184](https://github.com/qubic/wallet-extension/commit/55b91842bc4944830d594b98c51d8954d542a4dd))
* **review:** align account auth semantics and locale coverage ([f809a76](https://github.com/qubic/wallet-extension/commit/f809a76b032653920f5ba256fd49c1ebd97415e0))
* **router:** consolidate route transitions with shared wrapper ([3bf14f8](https://github.com/qubic/wallet-extension/commit/3bf14f859ce4e3effec4bda5984de70c466a2b2b))
* **router:** remove redundant lock guard condition ([371f1a5](https://github.com/qubic/wallet-extension/commit/371f1a5a55f5afbe7b62a5f720f785b11a3fd735))
* **router:** replace leftover motion wrapper with AnimatedRoute ([1635e82](https://github.com/qubic/wallet-extension/commit/1635e82392c993dabdc80067a1e46b484bbef14a))
* **security:** clear sensitive form data after auth and onboarding flows ([c3a19bf](https://github.com/qubic/wallet-extension/commit/c3a19bf2aeed51307acfd761f516fc944e674065))
* **security:** reduce extension attack surface and harden chart styles ([6a95ea6](https://github.com/qubic/wallet-extension/commit/6a95ea63d2a9c18906b63a1a17ad054f65cd8b21))
* **security:** scope wallet reset to wallet-owned storage keys ([bb12e06](https://github.com/qubic/wallet-extension/commit/bb12e06a3712c0c890f7ac48c89f4a628774ac85))
* **shell:** make bottom-nav icon colors theme-aware ([8a4e41b](https://github.com/qubic/wallet-extension/commit/8a4e41bfe747f5d8559c1995aad17866fe9530a7))
* **shell:** polish nav interactions and scrolling behavior ([019a445](https://github.com/qubic/wallet-extension/commit/019a445525eb17c65fffb74a2ba7a8ef0fefb7d4))
* **shell:** prevent global content overlap with bottom nav ([d14c1ba](https://github.com/qubic/wallet-extension/commit/d14c1babd4d4e6eb4db388987c2633dde5d7c4b6))
* show From prefix for all incoming transactions ([bfb0cae](https://github.com/qubic/wallet-extension/commit/bfb0cae383c005f7470ad14e52ff8e60c9925e57))
* show QUBIC instead of QU in transfer form title ([43d3b21](https://github.com/qubic/wallet-extension/commit/43d3b2107132c59c8dc413b4ceeee6b6e149cb26))
* show resend button for failed trx in home ([54ff596](https://github.com/qubic/wallet-extension/commit/54ff5967ee388f4d65a26d248fcd493d9997d141))
* show the delete button for invalid trxs ([6aca00b](https://github.com/qubic/wallet-extension/commit/6aca00b303d1ff68999c52c40ee36718b76db278))
* show transaction details for pending and failed transactions ([d3900b2](https://github.com/qubic/wallet-extension/commit/d3900b25b50aa5e8eb0857d934eb952c4b2e8a8f))
* **sidepanel:** close popup after opening side panel ([756dfe5](https://github.com/qubic/wallet-extension/commit/756dfe592b1f99dcffd738827947bbbfb1f6b930))
* **sidepanel:** let content expand with sidepanel width ([ec46ee2](https://github.com/qubic/wallet-extension/commit/ec46ee213559d4897e8bc91609be20790e3f8520))
* **storage:** clear dapp and vault mirror state on reset ([7c60625](https://github.com/qubic/wallet-extension/commit/7c6062591ad9545adfe08281239404a43f36f17a))
* **tooling:** type vite reload plugin ([086e849](https://github.com/qubic/wallet-extension/commit/086e849d7666d7bed4cfbdbbefbf2decde947048))
* **transfer-rights:** match both singular and plural procedure identifiers ([7815b07](https://github.com/qubic/wallet-extension/commit/7815b07a67922542ed78f348eeb6aad183f37320))
* **transfer-rights:** remove redundant tick label and align input ([2bf8174](https://github.com/qubic/wallet-extension/commit/2bf81749e67a890d3daaaf3d36ca8547398a4d38))
* **transfer:** clear decrypted seed state when wallet locks ([482aca1](https://github.com/qubic/wallet-extension/commit/482aca1b1afa241810078465490f72f5ee55340d))
* **transfer:** format target tick consistently across transfer flow ([5ecdbeb](https://github.com/qubic/wallet-extension/commit/5ecdbeb8793e97422ff39f84792f63046990cb0d))
* **transfer:** format target tick, remove account selector, and minor UI fixes ([738b913](https://github.com/qubic/wallet-extension/commit/738b91391d20716a92f0b00abbf11dcc9000f22e))
* **transfer:** keep failed pending entries until manual delete ([b31dcec](https://github.com/qubic/wallet-extension/commit/b31dcecced842961ed6e5e1596f06050f71e329c))
* **transfer:** prefill resend fields from failed transaction ([38028c2](https://github.com/qubic/wallet-extension/commit/38028c22cc7abfd80ed29b2bd73bd10ba7ba84e0))
* **transfer:** remove pending transaction blocking ([03afd64](https://github.com/qubic/wallet-extension/commit/03afd646cf16f83acfe4a88960c896f2fd815e3b))
* **transfer:** show QX-managed balance, remove redundant tick label, match input styling ([3d5b508](https://github.com/qubic/wallet-extension/commit/3d5b5084048f11f9d5794d120ba07612b4b57ab9))
* **transfer:** use suggested target tick for chip-based scheduling ([f39fe53](https://github.com/qubic/wallet-extension/commit/f39fe53a1add87d785a0bb9fe9aa6735ce80c191))
* trigger a full page reload after resetting ([9a61d09](https://github.com/qubic/wallet-extension/commit/9a61d090f2e36f3d8290e919022111f3c1f5f704))
* truncate long account names across wallet UI ([#146](https://github.com/qubic/wallet-extension/issues/146)) ([e78c762](https://github.com/qubic/wallet-extension/commit/e78c7626e9578468102faf61f0c6a5be40d56937))
* **tx-details:** add back button to transaction details page ([c2dd983](https://github.com/qubic/wallet-extension/commit/c2dd983fcdbd6210759ec7d053ba3644ecad3fd4))
* **tx-details:** format amount without bigint precision loss ([fac083d](https://github.com/qubic/wallet-extension/commit/fac083dcc98503d9c555e763ef0b207691f8e8b7))
* **tx-details:** remove duplicate hash, rename to TX ID, reposition explorer button ([bacb369](https://github.com/qubic/wallet-extension/commit/bacb3693b6fbff3f57394a71a8a4401a1ba1e49b))
* **txDetails:** show native token symbol next to amount ([3f7d83d](https://github.com/qubic/wallet-extension/commit/3f7d83d4f1671e8f710fe2441531fac082e7fe03))
* **txDetails:** show QU symbol and align field order with explorer ([a07fcce](https://github.com/qubic/wallet-extension/commit/a07fcceaae1380ae0f7e32b6e8645486555bdfba))
* **tx:** extract shared presentation logic and fix display issues ([33b0c95](https://github.com/qubic/wallet-extension/commit/33b0c950be6ff594c653242fd9d11ed7682e0e85))
* **ui:** add copy button in header, custom send/receive icons, and hide actions for watch-only ([c887a6b](https://github.com/qubic/wallet-extension/commit/c887a6b60b955107b81abb24bf2c29f061983ca5))
* **ui:** add destructive-outline button variant for delete actions ([8e2e8e4](https://github.com/qubic/wallet-extension/commit/8e2e8e4893a0fae9f6b4a53d3cc58a8ec9a33f76))
* **ui:** add eye toggle to vault import and improve input-group border visibility ([6eb2551](https://github.com/qubic/wallet-extension/commit/6eb2551e211f0a35f802ff9efb60bf8deeaf3b8d))
* **ui:** disable extension tab mode entry points ([8e39bdb](https://github.com/qubic/wallet-extension/commit/8e39bdb2e7e477a7db41a730fc4194879fa2680a))
* **ui:** improve watch-only and active badges in home and accounts pages ([86ba588](https://github.com/qubic/wallet-extension/commit/86ba588f9a0c286eee6982df3f737c1d26250003))
* **ui:** make bottom nav theme-aware ([fdcc728](https://github.com/qubic/wallet-extension/commit/fdcc728976e75d3fbdc01039fa5dbbcbeb34406c))
* **ui:** move copy button next to field value in transaction details ([a66e8cf](https://github.com/qubic/wallet-extension/commit/a66e8cf8ac62510645fc72ab2fa3dd8fcbde462e))
* **ui:** remove tab i18n leftovers and widen sidepanel max-width override ([cc5e289](https://github.com/qubic/wallet-extension/commit/cc5e289c1bb8061e7d5ab44742e39895124c443b))
* **ui:** respect bottom nav safe area ([b87075c](https://github.com/qubic/wallet-extension/commit/b87075cb4caa6de969641ac6aeae16d1fa9585ef))
* **ui:** show account name in reveal seed drawer title ([d93ed32](https://github.com/qubic/wallet-extension/commit/d93ed32511eebe3e0224f9b6f9930f0e6a61df41))
* **ui:** toggle sidepanel button between open and close states ([33b59bb](https://github.com/qubic/wallet-extension/commit/33b59bb4ea967aca1545a24a382dd7863d48d7b6))
* **ui:** use correct grid columns for watch-only nav bar ([8408669](https://github.com/qubic/wallet-extension/commit/8408669163619c64deb6d146b1665bf1fa6d40eb))
* **ui:** use positive color for incoming amounts and fix failed tx layout ([f3b6165](https://github.com/qubic/wallet-extension/commit/f3b6165d92800bfb7b11298844dd603a2234e931))
* **ui:** use success color for positive token via var() ([eca1890](https://github.com/qubic/wallet-extension/commit/eca1890f273806a5c2ae175e1fdea2e745cff9b1))
* **unlock:** remove identity display from lock screen ([1d38967](https://github.com/qubic/wallet-extension/commit/1d38967603fede2c88ce8926989375590f5a38d6))
* **unlock:** validate passphrase against vault entry ([fe4d678](https://github.com/qubic/wallet-extension/commit/fe4d6789e8e49a3feeb975e55dc2b2fa2bba15a8))
* update data syncing ([#95](https://github.com/qubic/wallet-extension/issues/95)) ([f9c6f53](https://github.com/qubic/wallet-extension/commit/f9c6f53e31865257f7cb1c7d1cac027dbc6f9b31))
* update invalid identity message ([0aa1334](https://github.com/qubic/wallet-extension/commit/0aa13341db0951234cea8e2f37a2dbf9a0dac2bf))
* update the send flow to make the confirmation first ([1875d42](https://github.com/qubic/wallet-extension/commit/1875d4212a3818b2bff2b9c0208929c21a65e31c))
* use transfer-rights icon from wallet-app ([60fd9fa](https://github.com/qubic/wallet-extension/commit/60fd9fa7495d88be2bfd39990004a235598976b6))
* validate always first identity in vault to skip watch only accounts in manage-accounts.tsx ([e203cec](https://github.com/qubic/wallet-extension/commit/e203cec19f9e64270a3e59be972b6cd939a85ec8))
* validate always first identity in vault to skip watch only accounts in unlock.tsx ([49b4e6f](https://github.com/qubic/wallet-extension/commit/49b4e6f8bc8e6749034b89467b28d65c32477c40))
* **vault:** resolve passphrase validation failure when active account is watch-only ([63af6a1](https://github.com/qubic/wallet-extension/commit/63af6a1dce5d498f557e39ebf33eadf916a33e04))
* **vault:** support dapp signing in background worker ([c26e314](https://github.com/qubic/wallet-extension/commit/c26e31412475c266611e6bc28819ac3fd5e6709e))
* verify message visibility ([cb54c5b](https://github.com/qubic/wallet-extension/commit/cb54c5bb756eb9d7a9b24c3a79f154ff258b7ed4))


### Features

* **accounts:** adapt add-address onboarding flows ([88c4cf8](https://github.com/qubic/wallet-extension/commit/88c4cf8f4b6eb60ea45e68aa2981874bb119493f))
* **accounts:** add watch-only screen and routes ([980590d](https://github.com/qubic/wallet-extension/commit/980590d8816492fbb19004488a350697bb7709f5))
* **accounts:** redesign manage accounts flow ([540e5a2](https://github.com/qubic/wallet-extension/commit/540e5a2a514c47b8e290f779dc3016f08296a566))
* add amount in the transfer success page ([9197483](https://github.com/qubic/wallet-extension/commit/9197483e118c71bccd27c60466c6b4562bcf6cbf))
* add asset details view ([#121](https://github.com/qubic/wallet-extension/issues/121)) ([3723aa5](https://github.com/qubic/wallet-extension/commit/3723aa5c3179086f94085f175f5cfedb1c5b5ac4))
* add balance visibility toggle ([#110](https://github.com/qubic/wallet-extension/issues/110)) ([4572010](https://github.com/qubic/wallet-extension/commit/4572010bd14b12886f30f93ad989f331303036b3))
* add basic theme switch to settings page ([1d94a2a](https://github.com/qubic/wallet-extension/commit/1d94a2aada632ec963987701b36b10e32ae0a77e))
* add formatted number input for amounts and target tick ([f87960a](https://github.com/qubic/wallet-extension/commit/f87960a09b8213f6b89cec2b11d51dfceaa93d3d))
* add localization ([4888744](https://github.com/qubic/wallet-extension/commit/4888744d77f3d01584e73ca9fcc26e57615f4b21))
* add localization for seedSeucirtyStep page ([dd57680](https://github.com/qubic/wallet-extension/commit/dd57680ddc5f0118f584e7da6bfbc0ec0a89acab))
* add localization for transfer qubics feature ([574398d](https://github.com/qubic/wallet-extension/commit/574398d49878bf2f9837ece19a8f6a29a8b286b9))
* add notApproved status ([7826b1d](https://github.com/qubic/wallet-extension/commit/7826b1d1e5e04e0f217f2d5b72bfc623bf008e65))
* add qrcode for reveal seed ([6e5572b](https://github.com/qubic/wallet-extension/commit/6e5572bc52b3df7476b92fd391e27158ac58a887))
* add qubic dart assets ([9a87114](https://github.com/qubic/wallet-extension/commit/9a87114423be8a02888def47291c6a143f28e85e))
* add revoke asset management rights support and improve UI labels ([#122](https://github.com/qubic/wallet-extension/issues/122)) ([81acf39](https://github.com/qubic/wallet-extension/commit/81acf392c6afe2d8aada46496a91c599d730af69))
* add security screen for password change and lock timer ([d41978f](https://github.com/qubic/wallet-extension/commit/d41978fab38aed063b7ef71888516cbf326bf2ad))
* add self-send check for sign transaction ([8a0ed13](https://github.com/qubic/wallet-extension/commit/8a0ed13eab52d9c5a77aff6f18f9176bff0122c8))
* add settings screen ([15f625a](https://github.com/qubic/wallet-extension/commit/15f625aabdfcf37adc6d851477ed5e414e01d187))
* add sign/verify message ([d3e4a78](https://github.com/qubic/wallet-extension/commit/d3e4a781588b4ee1f7e8b00cff0cd4b5de9b7808))
* add toast feedback for copy private seed button ([9e14cdb](https://github.com/qubic/wallet-extension/commit/9e14cdb9515afef392753bb0a0425abe18291ace))
* add tokens selection input in the transfers screen ([4435cd1](https://github.com/qubic/wallet-extension/commit/4435cd15fa31b050d364e34250d3d6f6e3ffe7bb))
* add transfer qubics screen ([243dc1a](https://github.com/qubic/wallet-extension/commit/243dc1a2ca2d3253aebaf5182fba4144a7f0c1ad))
* align history and home tansactions with wallet-app separation behavior (confirmed - unconfirmed) ([8d1f25b](https://github.com/qubic/wallet-extension/commit/8d1f25b772ace380856cf7210cee04a98b9fe3c9))
* balance visibility toggle and dApp auth improvements ([cf62f2b](https://github.com/qubic/wallet-extension/commit/cf62f2b4d9ab7024a7d42c5b60418dd3edf0e005))
* complete qx transfer assets functionality ([299f9ee](https://github.com/qubic/wallet-extension/commit/299f9ee6de14380d94ebc99634a7322514bb7a78))
* **dapp:** add per-account permissions for connected dApps ([76331df](https://github.com/qubic/wallet-extension/commit/76331dfb6564b4584f8808889a49405aed81b3d4))
* **dapp:** add per-method approval titles and dApp favicon ([a7c29c3](https://github.com/qubic/wallet-extension/commit/a7c29c30469a076d0c353430eddbefd87fc5f507))
* **dapp:** add sendTransaction with target tick offset ([6668445](https://github.com/qubic/wallet-extension/commit/66684454604bb719007c35adfa2980dcd6a049da))
* **dapp:** add window.qubic bridge background router and signing flow ([3fb4495](https://github.com/qubic/wallet-extension/commit/3fb4495905fb489914e9fbecac4a86eb27b383b6))
* **dapp:** persist approval requests across worker restarts ([bca5c75](https://github.com/qubic/wallet-extension/commit/bca5c75689cc0b69cf9b33926d43fe78b761ae12))
* **dapp:** show account and fee in approval drawers ([772aba2](https://github.com/qubic/wallet-extension/commit/772aba2a6c2e532557a1666af3964076e0ce30fb))
* **dapp:** show toast notification after transaction broadcast ([d7d9cb7](https://github.com/qubic/wallet-extension/commit/d7d9cb715cc7155ea0796ce0471724dc7c9be079))
* **dapp:** track sendTransaction in pending tx state ([d4a8146](https://github.com/qubic/wallet-extension/commit/d4a8146dfd15fe8a296b04ef658a5795e6c5efaa))
* export vault file ([b5c1cf7](https://github.com/qubic/wallet-extension/commit/b5c1cf7e0ed56969d2013b2a84cb09123daf5673))
* **extension:** 8 bundle geist mono font ([cdb858f](https://github.com/qubic/wallet-extension/commit/cdb858f9380e05620ba981d96006ba6e7720ad34))
* **extension:** add shadcn ui, routes, and dev workflow ([29dc454](https://github.com/qubic/wallet-extension/commit/29dc4549b29c22ca7873df79e9477f70de906d66))
* **extension:** add side panel and refine shell ([b4f07db](https://github.com/qubic/wallet-extension/commit/b4f07db3fecbe5c05b9074066f90dd1d39a5f6ed))
* **extension:** add tab mode and header component ([1f5ba8e](https://github.com/qubic/wallet-extension/commit/1f5ba8e6965bc4aceb695e199f63b69a28c8fab1))
* **extension:** add theme-aware action icon sync ([4ec197f](https://github.com/qubic/wallet-extension/commit/4ec197f85b257c53aa8aa70a4e4ecb3c1d31b578))
* **extension:** reload dev surfaces ([a96e6ee](https://github.com/qubic/wallet-extension/commit/a96e6eee6088e151966a18be8ed768ad9b459c60))
* **extension:** scaffold extension popup with router and i18n ([09e03a2](https://github.com/qubic/wallet-extension/commit/09e03a20f41cb78f63a8bde67f5fd9643c0b84ef))
* handle executed and confirmed transactions ([b39f042](https://github.com/qubic/wallet-extension/commit/b39f0429bcbd3ece2ac74417e31575fe48b44103))
* **history:** add infinite scroll and row skeleton loading ([d867839](https://github.com/qubic/wallet-extension/commit/d867839b2e1c86bd0cb98d65bcd913be2256dbe2))
* **history:** group transactions by date sections ([5b3886c](https://github.com/qubic/wallet-extension/commit/5b3886ca7a73a01462088457d49044da2535f9d7))
* **home:** show live QUBIC price and simplify home screen layout ([4661d5b](https://github.com/qubic/wallet-extension/commit/4661d5b9ec9e75e9fba40d35ceb69acb81308e2a))
* **i18n:** add German, French, Russian, Turkish, Vietnamese, and Chinese translations ([3a674bb](https://github.com/qubic/wallet-extension/commit/3a674bbf734aca1af639ad62fd5b2e0e678e7d5c))
* **i18n:** add history date group and timestamp translation keys ([687f522](https://github.com/qubic/wallet-extension/commit/687f522a5730821e039375591b735d69fe966786))
* implement vault import/export using qubic-ts-library ([8571f36](https://github.com/qubic/wallet-extension/commit/8571f36350fe11a50665e87d0e9f89060b0fd32d))
* move passphrase auth component into a separate reusable component ([2185956](https://github.com/qubic/wallet-extension/commit/2185956e9418f024d4c1252c0cff179a0039986e))
* **onboarding:** add seed confirmation and password checks to create wallet flow ([5e441a6](https://github.com/qubic/wallet-extension/commit/5e441a6e080ff42324ae2e1ef547ddca5d40aa6d))
* **popup:** 8 polish screens and navigation ([30f2396](https://github.com/qubic/wallet-extension/commit/30f239615ad89a4db4f90e68672498bf821fb0de))
* **popup:** enhance history list ([435b335](https://github.com/qubic/wallet-extension/commit/435b335bc10baa71ff869b347f8a4e0f09e61563))
* **popup:** localize home ui ([89dbaef](https://github.com/qubic/wallet-extension/commit/89dbaefcdfa243fa5a20bf3baf8b03c3ae6cefff))
* **popup:** refine home screen and toasts ([2c2675a](https://github.com/qubic/wallet-extension/commit/2c2675a886f94f351134c0c9dc77c79a1408ddac))
* remove redundant ternary ([6f2d9d3](https://github.com/qubic/wallet-extension/commit/6f2d9d3528c3b118c3673ebf8e5c87f53e058a85))
* remove the border from cards ([de95b30](https://github.com/qubic/wallet-extension/commit/de95b3078dc370bbbc32f21dec386e2d5f95bc15))
* remove the transfer success page and update the toaster position and duration ([528f2c6](https://github.com/qubic/wallet-extension/commit/528f2c6fff260ff33e0103bd741257416d2f3681))
* remove unused watch-only flag from select token page ([68bdd18](https://github.com/qubic/wallet-extension/commit/68bdd18c20432f3f94f911bd5223de80a1d63936))
* resolve address names and SC procedures in transaction views ([#91](https://github.com/qubic/wallet-extension/issues/91)) ([f4bd4b8](https://github.com/qubic/wallet-extension/commit/f4bd4b87e1ae81f115bd42c8526bec0cc5632ab2))
* **settings:** add dapp approval drawer and connected sites management ([d9d0c47](https://github.com/qubic/wallet-extension/commit/d9d0c478f138d62ff11f08094e521b9c6fdb1c94))
* **settings:** move language and theme to General sub-page ([5d959c9](https://github.com/qubic/wallet-extension/commit/5d959c92a175e7f73172daf83ba2c9aadf8df5a4))
* **settings:** streamline connected sites account details ([dfce8a2](https://github.com/qubic/wallet-extension/commit/dfce8a2873f83b2376909d8eae07abaa9b6294db))
* **shared:** 8 add vault onboarding flow and routing ([3b56143](https://github.com/qubic/wallet-extension/commit/3b561439939d5661e83ce5bc10c95f07c8ca2c66))
* **shared:** add history translations ([dd6f5b4](https://github.com/qubic/wallet-extension/commit/dd6f5b4cb7e19e33569cbfc6f762b21244a50bb6))
* **shared:** add transfer route and account selection ([893d8b4](https://github.com/qubic/wallet-extension/commit/893d8b4e5a50e455f9c78516d5827f3d61333a5d))
* **shell:** redesign header and bottom navigation interactions ([3386091](https://github.com/qubic/wallet-extension/commit/338609136bbda351028fb97fb3e62d9ca4e9b546))
* show balances in account selector ([3346606](https://github.com/qubic/wallet-extension/commit/33466063f82cce8c12917a7060ef2ecc899ee844))
* show smart contract icon next to identified addresses ([b8a66eb](https://github.com/qubic/wallet-extension/commit/b8a66eb3eaf45b886c3f4739cceb9761acda3055))
* split select token into a separate step in transfer ([24b7ccc](https://github.com/qubic/wallet-extension/commit/24b7cccf0f01e9337e0160deb8a2f7bf02e46981))
* switch font and unlock after onboarding ([6fbc280](https://github.com/qubic/wallet-extension/commit/6fbc28020eb4efd389390c7aa1f7d0f62c8a7d1b))
* **transactions:** add tx details flow and refresh home/history UX ([1dedf75](https://github.com/qubic/wallet-extension/commit/1dedf75643cf1eb2dc4996ff0612d610b7f38923))
* **transactions:** add tx details skeleton loading state ([d551a71](https://github.com/qubic/wallet-extension/commit/d551a71f005910af2ab04feed097f08b26c1ca28))
* **transactions:** use custom icons, sent/received labels, and timestamp display ([96d3f2b](https://github.com/qubic/wallet-extension/commit/96d3f2b6d39a0666fc144713ea60e5e06963c2df))
* transfer assets rights ([#103](https://github.com/qubic/wallet-extension/issues/103)) ([286f424](https://github.com/qubic/wallet-extension/commit/286f424a49752d5d8bd0adafa99b757c05b38611))
* transfer assets that are managed by qx only ([ba8b9df](https://github.com/qubic/wallet-extension/commit/ba8b9dfe46d2532a81a39174075145316a339da9))
* **transfer:** add target tick controls and pending-send guard ([446c274](https://github.com/qubic/wallet-extension/commit/446c274ad32b2514e6bbbd306697e5dca31f9b58))
* **tx-details:** add timestamp field and format amount and tick ([d866246](https://github.com/qubic/wallet-extension/commit/d8662465024d0737d59cca1276d388d0163ad189))
* **ui:** add positive color for incoming transaction amounts ([b52c338](https://github.com/qubic/wallet-extension/commit/b52c338605723dec074adecdd90eafc9f4ee66f7)), closes [#7ed890](https://github.com/qubic/wallet-extension/issues/7ed890) [#2e7d32](https://github.com/qubic/wallet-extension/issues/2e7d32)
* **ui:** remove accounts tab from nav bar and improve settings layout ([fa4bbd7](https://github.com/qubic/wallet-extension/commit/fa4bbd719c7a02783e40be684f66dd57e767934d))
* update failed/invalid icons to match explorer ([c623902](https://github.com/qubic/wallet-extension/commit/c623902f3a8787557865e2ff9de218cf60a4a378))
* update global css with qubic themes ([54f5904](https://github.com/qubic/wallet-extension/commit/54f590462aae61208e8e9bacbe76004ad1fc3ff8))
* update home actions (send, recieve) icons to align with mobile icons ([ccf8a36](https://github.com/qubic/wallet-extension/commit/ccf8a363e48057a8b2cf9477682f83238067cc9f))
* update localization for fee ([febb3f9](https://github.com/qubic/wallet-extension/commit/febb3f9346f474aa6b7ee2d420709e5576f1dd36))
* update transfer screen ui ([8f3db4d](https://github.com/qubic/wallet-extension/commit/8f3db4dcffa33eecd93cfec50f503b088f59844b))
* use colors from qubic theme instead of hardcoding values ([749f86f](https://github.com/qubic/wallet-extension/commit/749f86f059cf2b98f3e9e6650eda367f04f4af02))

# [1.0.0-beta.8](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.7...v1.0.0-beta.8) (2026-04-30)


### Bug Fixes

* update invalid identity message ([0aa1334](https://github.com/qubic/wallet-extension/commit/0aa13341db0951234cea8e2f37a2dbf9a0dac2bf))
* verify message visibility ([cb54c5b](https://github.com/qubic/wallet-extension/commit/cb54c5bb756eb9d7a9b24c3a79f154ff258b7ed4))


### Features

* add localization ([4888744](https://github.com/qubic/wallet-extension/commit/4888744d77f3d01584e73ca9fcc26e57615f4b21))
* add sign/verify message ([d3e4a78](https://github.com/qubic/wallet-extension/commit/d3e4a781588b4ee1f7e8b00cff0cd4b5de9b7808))


---

**Qubic Wallet — Beta Release**

Manage your Qubic accounts, send transfers, transfer asset rights, and connect to dApps via the `window.qubic` provider API.

This is a pre-release build — please report any issues on [GitHub Issues](https://github.com/qubic/wallet-extension/issues).

## Install (Chrome / Chromium)

### First time

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension from the puzzle icon in the toolbar

### Updating

1. Download the new **wallet-extension-dist.zip**
2. Delete the contents of your existing extension folder
3. Unzip the new files into the **same folder**
4. Open `chrome://extensions` and click the **reload** button (↻) on the extension

> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.

# [1.0.0-beta.7](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.6...v1.0.0-beta.7) (2026-04-27)


### Bug Fixes

* add default_locale to dev manifest ([9e52463](https://github.com/qubic/wallet-extension/commit/9e524637d471bddc44cffd764d51d8e607c2d794))
* **manifest:** prepare extension for Chrome Web Store submission ([#145](https://github.com/qubic/wallet-extension/issues/145)) ([1f57a19](https://github.com/qubic/wallet-extension/commit/1f57a197457b71f09de276e494ed52bed6588560))
* **transfer-rights:** match both singular and plural procedure identifiers ([7815b07](https://github.com/qubic/wallet-extension/commit/7815b07a67922542ed78f348eeb6aad183f37320))
* truncate long account names across wallet UI ([#146](https://github.com/qubic/wallet-extension/issues/146)) ([e78c762](https://github.com/qubic/wallet-extension/commit/e78c7626e9578468102faf61f0c6a5be40d56937))


### Features

* show smart contract icon next to identified addresses ([b8a66eb](https://github.com/qubic/wallet-extension/commit/b8a66eb3eaf45b886c3f4739cceb9761acda3055))


---

**Qubic Wallet — Beta Release**

Manage your Qubic accounts, send transfers, transfer asset rights, and connect to dApps via the `window.qubic` provider API.

This is a pre-release build — please report any issues on [GitHub Issues](https://github.com/qubic/wallet-extension/issues).

## Install (Chrome / Chromium)

### First time

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension from the puzzle icon in the toolbar

### Updating

1. Download the new **wallet-extension-dist.zip**
2. Delete the contents of your existing extension folder
3. Unzip the new files into the **same folder**
4. Open `chrome://extensions` and click the **reload** button (↻) on the extension

> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.

# [1.0.0-beta.6](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.5...v1.0.0-beta.6) (2026-04-03)


### Bug Fixes

* add navigation for invalid and failed trxs ([e8b5c29](https://github.com/qubic/wallet-extension/commit/e8b5c295a7a1a2b8ccaae01c72a2e6c683d229f5))
* **extension:** unify side panel toggle behavior ([0d8a708](https://github.com/qubic/wallet-extension/commit/0d8a70823f2c1f7a15ccd4d43f97f4c4e04c65e3))
* fix and centralize failed transactions logic ([a15c46d](https://github.com/qubic/wallet-extension/commit/a15c46dbc7e9fc13b041917f8c3920bfaa53d38f))
* localize invalid identity checksum error in transfer ([#140](https://github.com/qubic/wallet-extension/issues/140)) ([b46081a](https://github.com/qubic/wallet-extension/commit/b46081ae21f66b9cdc362d1460dd3f0263681b33))
* make the failed transaction appears on their correct order in the list no necessart at the top ([93ee4d8](https://github.com/qubic/wallet-extension/commit/93ee4d8ed23f47172fa0ac1f0d5c48dcb1e92955))
* prevent amount input text overlapping token label and Max button ([5824e2b](https://github.com/qubic/wallet-extension/commit/5824e2b0916004d131af4653e50990bd71f6a45b))
* remove squeezing from icons if the transatcion row is taller ([12864bf](https://github.com/qubic/wallet-extension/commit/12864bf5cc7ef8390c6ae2db77f99b23cfb07438))
* resolve stuck failed pending transactions ([55b9184](https://github.com/qubic/wallet-extension/commit/55b91842bc4944830d594b98c51d8954d542a4dd))
* show QUBIC instead of QU in transfer form title ([43d3b21](https://github.com/qubic/wallet-extension/commit/43d3b2107132c59c8dc413b4ceeee6b6e149cb26))
* show resend button for failed trx in home ([54ff596](https://github.com/qubic/wallet-extension/commit/54ff5967ee388f4d65a26d248fcd493d9997d141))
* show the delete button for invalid trxs ([6aca00b](https://github.com/qubic/wallet-extension/commit/6aca00b303d1ff68999c52c40ee36718b76db278))


### Features

* add notApproved status ([7826b1d](https://github.com/qubic/wallet-extension/commit/7826b1d1e5e04e0f217f2d5b72bfc623bf008e65))
* align history and home tansactions with wallet-app separation behavior (confirmed - unconfirmed) ([8d1f25b](https://github.com/qubic/wallet-extension/commit/8d1f25b772ace380856cf7210cee04a98b9fe3c9))
* handle executed and confirmed transactions ([b39f042](https://github.com/qubic/wallet-extension/commit/b39f0429bcbd3ece2ac74417e31575fe48b44103))
* remove redundant ternary ([6f2d9d3](https://github.com/qubic/wallet-extension/commit/6f2d9d3528c3b118c3673ebf8e5c87f53e058a85))
* update failed/invalid icons to match explorer ([c623902](https://github.com/qubic/wallet-extension/commit/c623902f3a8787557865e2ff9de218cf60a4a378))


---

**Qubic Wallet — Beta Release**

Manage your Qubic accounts, send transfers, transfer asset rights, and connect to dApps via the `window.qubic` provider API.

This is a pre-release build — please report any issues on [GitHub Issues](https://github.com/qubic/wallet-extension/issues).

## Install (Chrome / Chromium)

### First time

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension from the puzzle icon in the toolbar

### Updating

1. Download the new **wallet-extension-dist.zip**
2. Delete the contents of your existing extension folder
3. Unzip the new files into the **same folder**
4. Open `chrome://extensions` and click the **reload** button (↻) on the extension

> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.

# [1.0.0-beta.5](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.4...v1.0.0-beta.5) (2026-03-29)


### Bug Fixes

* add contrast to watch only account badge in case of light mode ([927ffb8](https://github.com/qubic/wallet-extension/commit/927ffb88100f620cefe79a6b1f14c2057206bfc4))
* **dapp:** block signing flow for watch-only accounts ([bab3681](https://github.com/qubic/wallet-extension/commit/bab368177ca549f0d384f2bc0846491e83932184))
* **dapp:** improve transaction approval UI ([163c092](https://github.com/qubic/wallet-extension/commit/163c092871d37033fd52879f55cf43a0997c5d72))
* **dapp:** only show target tick when explicitly assigned in request ([45cb257](https://github.com/qubic/wallet-extension/commit/45cb257874c7b295f151f8e5c2f8602658e2b7b5))
* **dapp:** persist watch-only state for approvals ([5aee033](https://github.com/qubic/wallet-extension/commit/5aee033fab682dd31922c77647b654b4290ea6b8))
* **dapp:** strict numeric validation and tick-in-past rejection ([e82e740](https://github.com/qubic/wallet-extension/commit/e82e7404e870dd0fe1c0f67f77a3759f5b7afbf3))
* **i18n:** localize hardcoded strings and consolidate shared keys ([269fdaf](https://github.com/qubic/wallet-extension/commit/269fdafb2acb28a8d37aca118b5f067eae135b70))
* make failed transactions clickable and show failed status hint ([d08a23d](https://github.com/qubic/wallet-extension/commit/d08a23def14774539e4d0b2225a11f26658a6a02))
* prevent duplicate vault entries when renaming accounts ([#129](https://github.com/qubic/wallet-extension/issues/129)) ([979d984](https://github.com/qubic/wallet-extension/commit/979d984d2a738c1ad785d729548324357722e0c5))
* remove tabular-nums from asset balances ([a65cdfc](https://github.com/qubic/wallet-extension/commit/a65cdfc5bd50e883769c6d66a1f6f40129d67415))
* show From prefix for all incoming transactions ([bfb0cae](https://github.com/qubic/wallet-extension/commit/bfb0cae383c005f7470ad14e52ff8e60c9925e57))
* show transaction details for pending and failed transactions ([d3900b2](https://github.com/qubic/wallet-extension/commit/d3900b25b50aa5e8eb0857d934eb952c4b2e8a8f))
* **txDetails:** show native token symbol next to amount ([3f7d83d](https://github.com/qubic/wallet-extension/commit/3f7d83d4f1671e8f710fe2441531fac082e7fe03))
* **txDetails:** show QU symbol and align field order with explorer ([a07fcce](https://github.com/qubic/wallet-extension/commit/a07fcceaae1380ae0f7e32b6e8645486555bdfba))
* **ui:** show account name in reveal seed drawer title ([d93ed32](https://github.com/qubic/wallet-extension/commit/d93ed32511eebe3e0224f9b6f9930f0e6a61df41))
* **ui:** use correct grid columns for watch-only nav bar ([8408669](https://github.com/qubic/wallet-extension/commit/8408669163619c64deb6d146b1665bf1fa6d40eb))
* **ui:** use positive color for incoming amounts and fix failed tx layout ([f3b6165](https://github.com/qubic/wallet-extension/commit/f3b6165d92800bfb7b11298844dd603a2234e931))
* use transfer-rights icon from wallet-app ([60fd9fa](https://github.com/qubic/wallet-extension/commit/60fd9fa7495d88be2bfd39990004a235598976b6))


### Features

* add asset details view ([#121](https://github.com/qubic/wallet-extension/issues/121)) ([3723aa5](https://github.com/qubic/wallet-extension/commit/3723aa5c3179086f94085f175f5cfedb1c5b5ac4))
* add formatted number input for amounts and target tick ([f87960a](https://github.com/qubic/wallet-extension/commit/f87960a09b8213f6b89cec2b11d51dfceaa93d3d))
* add revoke asset management rights support and improve UI labels ([#122](https://github.com/qubic/wallet-extension/issues/122)) ([81acf39](https://github.com/qubic/wallet-extension/commit/81acf392c6afe2d8aada46496a91c599d730af69))
* **dapp:** add per-method approval titles and dApp favicon ([a7c29c3](https://github.com/qubic/wallet-extension/commit/a7c29c30469a076d0c353430eddbefd87fc5f507))
* **dapp:** show toast notification after transaction broadcast ([d7d9cb7](https://github.com/qubic/wallet-extension/commit/d7d9cb715cc7155ea0796ce0471724dc7c9be079))


---

**Qubic Wallet — Beta Release**

Manage your Qubic accounts, send transfers, transfer asset rights, and connect to dApps via the `window.qubic` provider API.

This is a pre-release build — please report any issues on [GitHub Issues](https://github.com/qubic/wallet-extension/issues).

## Install (Chrome / Chromium)

### First time

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension from the puzzle icon in the toolbar

### Updating

1. Download the new **wallet-extension-dist.zip**
2. Delete the contents of your existing extension folder
3. Unzip the new files into the **same folder**
4. Open `chrome://extensions` and click the **reload** button (↻) on the extension

> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.

# [1.0.0-beta.4](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.3...v1.0.0-beta.4) (2026-03-19)


### Bug Fixes

* **ci:** resolve version before build so dist contains correct version ([71a0fe7](https://github.com/qubic/wallet-extension/commit/71a0fe7e36dd9a49c34f2dec8500344549ecb451))
* **dapp:** improve signing approval passphrase handling ([55d7b38](https://github.com/qubic/wallet-extension/commit/55d7b38f04177def5401695cc7070d1f44d3015c))
* **dapp:** require active account for connect ([ed22cd5](https://github.com/qubic/wallet-extension/commit/ed22cd534ac4dfc90750e4ddb821b4aa79a87fe3))
* **home:** add bQUBIC suffix and highlight price in primary color ([b89798d](https://github.com/qubic/wallet-extension/commit/b89798dd0328d5eb3080d386b54dc990653dec27))
* **i18n:** add missing transfer.confirm.from key to all locales ([a7ff859](https://github.com/qubic/wallet-extension/commit/a7ff8590c5f1b5e9f11307c99e61e8dd493f9e3b))
* **i18n:** remove orphaned txDetails.copyTxId and txDetails.refresh keys ([241a306](https://github.com/qubic/wallet-extension/commit/241a306f58bc1ab21ac8a17f49755c6775e77c5c))
* **i18n:** rename vault recipients label to "Your accounts" ([2059da8](https://github.com/qubic/wallet-extension/commit/2059da8b9fad9eaff6a33ad73c8184150fe71ef1))
* **release:** show beta intro and install instructions only on beta releases ([819df2b](https://github.com/qubic/wallet-extension/commit/819df2b26105c3d1e11ec2370fc71ab55170369b))
* **review:** align account auth semantics and locale coverage ([f809a76](https://github.com/qubic/wallet-extension/commit/f809a76b032653920f5ba256fd49c1ebd97415e0))
* **transfer-rights:** remove redundant tick label and align input ([2bf8174](https://github.com/qubic/wallet-extension/commit/2bf81749e67a890d3daaaf3d36ca8547398a4d38))
* **transfer:** show QX-managed balance, remove redundant tick label, match input styling ([3d5b508](https://github.com/qubic/wallet-extension/commit/3d5b5084048f11f9d5794d120ba07612b4b57ab9))
* **tx-details:** remove duplicate hash, rename to TX ID, reposition explorer button ([bacb369](https://github.com/qubic/wallet-extension/commit/bacb3693b6fbff3f57394a71a8a4401a1ba1e49b))
* **tx:** extract shared presentation logic and fix display issues ([33b0c95](https://github.com/qubic/wallet-extension/commit/33b0c950be6ff594c653242fd9d11ed7682e0e85))
* **ui:** use success color for positive token via var() ([eca1890](https://github.com/qubic/wallet-extension/commit/eca1890f273806a5c2ae175e1fdea2e745cff9b1))


### Features

* add balance visibility toggle ([#110](https://github.com/qubic/wallet-extension/issues/110)) ([4572010](https://github.com/qubic/wallet-extension/commit/4572010bd14b12886f30f93ad989f331303036b3))
* **i18n:** add German, French, Russian, Turkish, Vietnamese, and Chinese translations ([3a674bb](https://github.com/qubic/wallet-extension/commit/3a674bbf734aca1af639ad62fd5b2e0e678e7d5c))
* **settings:** streamline connected sites account details ([dfce8a2](https://github.com/qubic/wallet-extension/commit/dfce8a2873f83b2376909d8eae07abaa9b6294db))
* **ui:** add positive color for incoming transaction amounts ([b52c338](https://github.com/qubic/wallet-extension/commit/b52c338605723dec074adecdd90eafc9f4ee66f7)), closes [#7ed890](https://github.com/qubic/wallet-extension/issues/7ed890) [#2e7d32](https://github.com/qubic/wallet-extension/issues/2e7d32)


---

**Qubic Wallet — Beta Release**

Manage your Qubic accounts, send transfers, transfer asset rights, and connect to dApps via the `window.qubic` provider API.

This is a pre-release build — please report any issues on [GitHub Issues](https://github.com/qubic/wallet-extension/issues).

## Install (Chrome / Chromium)

### First time

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension from the puzzle icon in the toolbar

### Updating

1. Download the new **wallet-extension-dist.zip**
2. Delete the contents of your existing extension folder
3. Unzip the new files into the **same folder**
4. Open `chrome://extensions` and click the **reload** button (↻) on the extension

> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.

# [1.0.0-beta.3](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.2...v1.0.0-beta.3) (2026-03-19)


### Features

* balance visibility toggle and dApp auth improvements ([cf62f2b](https://github.com/qubic/wallet-extension/commit/cf62f2b4d9ab7024a7d42c5b60418dd3edf0e005))


---

## Install (Chrome / Chromium)

### First time

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension from the puzzle icon in the toolbar

### Updating

1. Download the new **wallet-extension-dist.zip**
2. Delete the contents of your existing extension folder
3. Unzip the new files into the **same folder**
4. Open `chrome://extensions` and click the **reload** button (↻) on the extension

> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.

# [1.0.0-beta.2](https://github.com/qubic/wallet-extension/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2026-03-18)


### Bug Fixes

* **ci:** resolve version before build so dist contains correct version ([60a8eed](https://github.com/qubic/wallet-extension/commit/60a8eed4b339f985064b3506edb650931af3aaa2))


---

## Install (Chrome / Chromium)

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a folder
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the unzipped folder
7. Pin the extension from the puzzle icon in the toolbar

### Updating to a new version

1. Download the new **wallet-extension-dist.zip**
2. Unzip and **replace the files in the same folder** you loaded originally
3. Go to `chrome://extensions` and click the reload button on the extension

> **Important:** Do not remove and re-load from a different folder — this changes the extension ID and you will lose your accounts and settings.

# 1.0.0-beta.1 (2026-03-18)


### Bug Fixes

* **a11y:** use button for draggable account rows ([8201259](https://github.com/qubic/wallet-extension/commit/82012593401e1695b18eaf21812f6afa7d6d9f9f))
* **accounts:** avoid keeping vault passphrase in component state ([f8efe68](https://github.com/qubic/wallet-extension/commit/f8efe687d5418d0566d9404e327328f96d058651))
* **accounts:** base default name on existing account count ([3deb3b1](https://github.com/qubic/wallet-extension/commit/3deb3b1861d471be2a61c06c38e4180d684e2d13))
* **accounts:** block transfer actions for watch-only accounts ([798bb0d](https://github.com/qubic/wallet-extension/commit/798bb0d3da076efb3c353a9b0131ae50277be6ad))
* **accounts:** clear saved account order when last account is removed ([d1b5b21](https://github.com/qubic/wallet-extension/commit/d1b5b212f9c1ec7ec3ba15d7efdb930cc32b35e0))
* **accounts:** deduplicate name checks with shared helper and i18n errors ([2148e9b](https://github.com/qubic/wallet-extension/commit/2148e9bbc54916277be29cd1fcd400c50fe6175f))
* **accounts:** default new address name to Account <n> ([71bdd2e](https://github.com/qubic/wallet-extension/commit/71bdd2e88fa848b6ebba7b2db2198bac271e68be))
* **accounts:** emit updates for cache/order mutations ([84c9042](https://github.com/qubic/wallet-extension/commit/84c90420931657f9750e85600564a76d4f9289bf))
* **accounts:** localize and parameterize suggested add-address names ([f4921c8](https://github.com/qubic/wallet-extension/commit/f4921c8807796702c74b828cde798df9f055f22a))
* **accounts:** move add-account button to header in manage accounts and popover ([0559284](https://github.com/qubic/wallet-extension/commit/05592849a65db1aa5e9838d82ab56f7cae621833))
* **accounts:** navigate to home when selecting account in manage accounts ([69ea97b](https://github.com/qubic/wallet-extension/commit/69ea97ba1617f45fc2ddeebd75a44b5418608440))
* **accounts:** populate account cache on vault import and unlock ([15b7167](https://github.com/qubic/wallet-extension/commit/15b716796482717ca30556f6de9a5bca1e43c9c0))
* **accounts:** prevent removing the last wallet account ([e35f29a](https://github.com/qubic/wallet-extension/commit/e35f29a57d3e792a2806e14880f0c833ee3d6e38))
* **accounts:** resolve manage accounts lint ([12d572c](https://github.com/qubic/wallet-extension/commit/12d572c379a93b5d5fa426abf1cfeabf66428298))
* **accounts:** return create-account flow to manage accounts ([19832c9](https://github.com/qubic/wallet-extension/commit/19832c9d6db5a786459214beef1ae3156b11be92))
* **accounts:** set newly created account as active after vault creation ([241d680](https://github.com/qubic/wallet-extension/commit/241d68029280cd3c74e2b1a8162db37d6be0c34c))
* **accounts:** show rename validation inside drawer ([dba9a41](https://github.com/qubic/wallet-extension/commit/dba9a41e11285efd9c601242328411faef478f45))
* **accounts:** sync active account state instantly across screens ([76ab284](https://github.com/qubic/wallet-extension/commit/76ab284b5a38e2bade0e94da78dab4274ab10dfb))
* **accounts:** update header name when renaming active watch-only account ([be725b4](https://github.com/qubic/wallet-extension/commit/be725b4c79851ae98007eea8ca0cbbb30f18bc77))
* **accounts:** write renamed vault entry before deleting old one ([8c4ff18](https://github.com/qubic/wallet-extension/commit/8c4ff181f9c23436bce321f96673e5238698c975))
* add cleanup and error handling to seed QR effect ([8a099fb](https://github.com/qubic/wallet-extension/commit/8a099fb3f9199c2d649b3ed8219e4746b84b2ce8))
* add validation to prevent sending qus to the sender's address ([4a0dd9e](https://github.com/qubic/wallet-extension/commit/4a0dd9ee33a73a9a18ca3bbb72862d84ce653bc1))
* aggregate assets by token ([4690c4f](https://github.com/qubic/wallet-extension/commit/4690c4f57e9027e6136baa073ef456060a450ee4))
* aggregate assets by token in the transfer view ([cdbff4d](https://github.com/qubic/wallet-extension/commit/cdbff4dc9f709e120a049bde3cc1459e8911817b))
* append watch only accounts to the export vault ([#67](https://github.com/qubic/wallet-extension/issues/67)) ([c91c037](https://github.com/qubic/wallet-extension/commit/c91c0374b883a963550a847ea581a81465ba067a))
* **app:** resolve dev conflict and align rpc base url ([7844792](https://github.com/qubic/wallet-extension/commit/78447921cc5ac6bea601a231fe4ccddd84c439d7))
* **auth:** use shared vault access validation in passphrase drawer ([1341ccc](https://github.com/qubic/wallet-extension/commit/1341ccc295ccd2866a37a6796f68d1d01552d509))
* **checkbox:** improve border visibility in light and dark mode ([016d824](https://github.com/qubic/wallet-extension/commit/016d8242f4b5340a3e361ece7c98bb563ab6e780))
* clear the passphrase after usage ([0903ce5](https://github.com/qubic/wallet-extension/commit/0903ce5e99d65958fcbdfdd1469ef5a8b2fdd084))
* correct passphrase-auth identity lookup and deduplicate vault events ([b1affcc](https://github.com/qubic/wallet-extension/commit/b1affcc548bfb0addc3e4eab71f73f6fb114e325))
* **dapp:** address review findings in approval flow ([db3dacd](https://github.com/qubic/wallet-extension/commit/db3dacd71e9367e5e1b3cc5b39437ff0335964a8))
* **dapp:** apply biome formatting in content script ([47587d2](https://github.com/qubic/wallet-extension/commit/47587d2e7dd9c8c41f413728ef8b9f452a93a5c0))
* **dapp:** bundle provider bridge as classic scripts ([eba8f12](https://github.com/qubic/wallet-extension/commit/eba8f12d8c9a98e6913f71fa6fd4cd0219df4d2b))
* **dapp:** deduplicate extension type declarations ([7ff6d54](https://github.com/qubic/wallet-extension/commit/7ff6d548d9cae9a6fc3046c7e98d46413de120a1))
* **dapp:** fail fast when approval window cannot be opened ([e4e5271](https://github.com/qubic/wallet-extension/commit/e4e52715af7dd022f5bb956cc4e599b3ae2cde0e))
* **dapp:** harden bridge and approval handling ([f374cc0](https://github.com/qubic/wallet-extension/commit/f374cc06ab08ac065406a74df529e3cb1fe0ddce))
* **dapp:** harden persisted approval payloads and replay handling ([5f3be90](https://github.com/qubic/wallet-extension/commit/5f3be90a65cfeb236fcb3295a12ec6bbf5f42763))
* **dapp:** improve approval popup and drawer behavior ([4a35956](https://github.com/qubic/wallet-extension/commit/4a359565143ec6d394e97dec9f7d96d449109536))
* **dapp:** limit web-accessible chunks for inpage provider ([6d3360f](https://github.com/qubic/wallet-extension/commit/6d3360f4dac5e88680192a6852aa1c3f5741ae92))
* **dapp:** persist inpage session across bridge reinjections ([e102cca](https://github.com/qubic/wallet-extension/commit/e102cca23b0d5c963f23159d19c077e2e8a43277))
* **dapp:** preserve original connected timestamp on reconnect ([d4e48d4](https://github.com/qubic/wallet-extension/commit/d4e48d43c8bdc9bf65055925758f81d616110b59))
* **dapp:** resolve send tx tick on approval ([9768309](https://github.com/qubic/wallet-extension/commit/976830964357d3fade8bd7675acf1d93f9ca5acd))
* **dapp:** ship classic provider scripts for extension injection ([59805be](https://github.com/qubic/wallet-extension/commit/59805beb3be56810126c4b34d2a22dedfd5405be))
* **dapp:** sync account snapshot and scope provider events ([1a2b4a7](https://github.com/qubic/wallet-extension/commit/1a2b4a7edc162cbfd840f52f1dbde9b8da5d6ffb))
* **dapp:** use shared rpc base url in app and controller ([e115622](https://github.com/qubic/wallet-extension/commit/e115622bdf4e2b949984f4248927d245fca90182))
* **dapp:** use sidepanel presence and accept popup approval decisions ([38c9e95](https://github.com/qubic/wallet-extension/commit/38c9e95521651241243c529a363849f4480c2ded))
* **dapp:** validate runtime payloads and limit pending approvals ([86bd9fc](https://github.com/qubic/wallet-extension/commit/86bd9fc4d43a0ab861010389286701e9edb6b58e))
* **dapp:** validate send tx self-send and balance before approval ([cdf7bc7](https://github.com/qubic/wallet-extension/commit/cdf7bc74cd5a0ca58bc23b8f03d0fcb06390d4f5))
* delete wallet function ([37a19d3](https://github.com/qubic/wallet-extension/commit/37a19d3722addd8ea4708c32137ec0a3b39fe4d5))
* disable continue button while asset data is loading ([39d200e](https://github.com/qubic/wallet-extension/commit/39d200e16283c9614c2614cc567b2ff44f351e23))
* fix button color hover contrast in dark mode ([5b5d466](https://github.com/qubic/wallet-extension/commit/5b5d46632a4810aceb377818739568d9554b6c7f))
* fix the drawer height overflow ([267d980](https://github.com/qubic/wallet-extension/commit/267d98018dcc9861d311828710d715734ff5a9c9))
* **header:** add scrollable account dropdown for long lists ([040996d](https://github.com/qubic/wallet-extension/commit/040996dfb2610500e41fb68fa0569dfa538733ab))
* **header:** align account dropdown balance with identity row ([f61f63b](https://github.com/qubic/wallet-extension/commit/f61f63bb8834993105fed9dd148b1203d4a59955))
* **header:** improve account selector and copy button placement ([2b3f71b](https://github.com/qubic/wallet-extension/commit/2b3f71ba8b1ba830820ca0e5e60cd70f2013e29b))
* **header:** remove passphrase prompt from account switching ([11eca2d](https://github.com/qubic/wallet-extension/commit/11eca2d29676cca7e154a5ec254616734ea02ea1))
* **header:** replace create account button with add account drawer trigger ([5f425bc](https://github.com/qubic/wallet-extension/commit/5f425bce501365453555a680cd6b951345c03edf))
* **header:** truncate long account names in header ([c98ead2](https://github.com/qubic/wallet-extension/commit/c98ead2d0ac8ac72295b3f3f695fead0d1e6bbac))
* **history:** align pagination and row cursor behavior ([2213b58](https://github.com/qubic/wallet-extension/commit/2213b585136b5e9e6f6305afe16d2f27041b5969))
* **history:** apply biome formatting for ci ([b12393d](https://github.com/qubic/wallet-extension/commit/b12393d5f550f231346a9c8562905fb20ce50d1d))
* **history:** memoize sorted transaction list derivation ([edf9120](https://github.com/qubic/wallet-extension/commit/edf9120e37ac24f498e0d616fa3600591fab3b5b))
* **history:** prevent infinite-scroll loop when sentinel stays visible ([d786a2b](https://github.com/qubic/wallet-extension/commit/d786a2b7c498e34bc596ebab2b8e601afa56eeb3))
* **history:** refresh transactions when active account changes ([eeb9955](https://github.com/qubic/wallet-extension/commit/eeb9955cc2aaa2c21aca0386be13b36571032040))
* **history:** reuse shared compact balance formatter ([86c0f86](https://github.com/qubic/wallet-extension/commit/86c0f8693f903eb91f55b9e403a0ae5d4ccb3b33))
* **history:** surface pending and failed transactions separately ([6450077](https://github.com/qubic/wallet-extension/commit/6450077696bb250a4b1fd913e1cc1400accbc6d6))
* **home:** add compact view-all action in recent history ([f498a36](https://github.com/qubic/wallet-extension/commit/f498a36ab06720b75e298b755a872ae704943fba))
* **home:** center layout outside constrained extension views ([dfd62bb](https://github.com/qubic/wallet-extension/commit/dfd62bb732a2374888d0285e49eb1bd70caae618))
* **home:** debounce syncing badge to prevent rapid flicker ([28fd90c](https://github.com/qubic/wallet-extension/commit/28fd90c7ae44c5d2dbbaeb260de4bbf3778c8595))
* **home:** improve account-switch reload and balance rendering ([cd597e2](https://github.com/qubic/wallet-extension/commit/cd597e2c0b30aa1b2839eddbb72ba14ebca4907a))
* **home:** preserve transaction preview enhancements after split ([784d254](https://github.com/qubic/wallet-extension/commit/784d2543aff2b89815d2d401ad4fdfea75eef176))
* **home:** prevent assets overflow under bottom nav ([0a6df9d](https://github.com/qubic/wallet-extension/commit/0a6df9dab6aa73bfae32a09189f84b80e09a913e))
* **home:** remove amount background and format tick with separators ([7bfdca5](https://github.com/qubic/wallet-extension/commit/7bfdca5eedd2f2de8c2b7e616a8c59b3450fa36c))
* **home:** replace balance counting animation with subtle pulse ([96e5d19](https://github.com/qubic/wallet-extension/commit/96e5d199167aabdd941490db96b292420f745b9e))
* **i18n:** add missing accent in spanish last-account message ([1370ae3](https://github.com/qubic/wallet-extension/commit/1370ae3cf94c93fe821c1b428fd88f808b065ddc))
* **i18n:** fix missing accent marks in Spanish translations ([a93eb45](https://github.com/qubic/wallet-extension/commit/a93eb45add24205144fc152883548a9fdf4f5c91))
* **i18n:** fix missing tildes in Spanish locale (contraseña) ([22fb232](https://github.com/qubic/wallet-extension/commit/22fb232db40480b02a78e2099c9e878f94c2ecd4))
* **i18n:** localize import-seed header and step label ([a69fcd2](https://github.com/qubic/wallet-extension/commit/a69fcd2ff36f5e6c9765da369ece76ca11318e01))
* **i18n:** use existing tx details title key on transfer success ([eca9742](https://github.com/qubic/wallet-extension/commit/eca97421cb118bb276920652c2df438dd9e259a5))
* **import:** reject vault files exceeding 100 KB ([6bc5207](https://github.com/qubic/wallet-extension/commit/6bc5207fbdc71210fde315a404d2813ca112a243))
* **layout:** restore full-height wrappers for centered pages ([498af85](https://github.com/qubic/wallet-extension/commit/498af85b4e9b995e7cc1ef4f8a1aea1a62115be1))
* **layout:** stabilize popup sizing and shell scrolling ([a836f64](https://github.com/qubic/wallet-extension/commit/a836f6448331f582344d6cc45555d7971cd6d872))
* **lock:** add fixed timeout presets and activity-based auto-lock ([9e8f865](https://github.com/qubic/wallet-extension/commit/9e8f86507294a33924dc3b9e3787203d41bb7744))
* **lock:** enforce browser-restart lock and set 15m default timeout ([67d6126](https://github.com/qubic/wallet-extension/commit/67d61263bb5f4cc5368047afc48c86ede968f863))
* **lock:** simplify timeout preset normalization fallback ([184eb63](https://github.com/qubic/wallet-extension/commit/184eb63dd39c15da917a6951a00b4eea0973bb48))
* make the nav bar fixed at bottom in macos chrome ([91c88e4](https://github.com/qubic/wallet-extension/commit/91c88e429a329dcf4f44dc6f75a998433e01db4b))
* **nav:** hide transfer tab for watch-only accounts ([7877765](https://github.com/qubic/wallet-extension/commit/7877765e4741161748008d9dc6cccdf4c4b4cbf7))
* **onboarding:** add realtime private-seed validation ([8563d3b](https://github.com/qubic/wallet-extension/commit/8563d3b0d58b2d0c1bb3b9e190e9a54172107984))
* **onboarding:** improve seed warning contrast in dark mode ([1951ef1](https://github.com/qubic/wallet-extension/commit/1951ef15e75165600d548c11cf2738bd1e4f9946))
* **onboarding:** keep wallet unlocked after setup completion ([d0d6d29](https://github.com/qubic/wallet-extension/commit/d0d6d293117951a5b80e35ff553268954f9351dc))
* **pending:** address review blockers in failed transaction flow ([a7f7bb0](https://github.com/qubic/wallet-extension/commit/a7f7bb02f94e875d7d904a023e65660fccbb61e2))
* **pending:** extract resend eligibility and unify history row rendering ([23e08b9](https://github.com/qubic/wallet-extension/commit/23e08b980b1f669b3fc2a08c0f75349472305261))
* **pending:** persist pending tx and refresh caches after settlement ([87bceb7](https://github.com/qubic/wallet-extension/commit/87bceb777bab3f6682ffd80949a2001c0749ed50))
* **pending:** prevent pending transactions from being resolved prematurely ([55f425d](https://github.com/qubic/wallet-extension/commit/55f425d387b8943c25528ce947ed0ccb362ca74c))
* **pending:** remove failed entries on resend and allow manual delete ([4bfacf0](https://github.com/qubic/wallet-extension/commit/4bfacf0c6a290f22799d2a1ae68bce1a93bcf1cd))
* **pending:** track failed state and resolve by archiver tick ([54dd420](https://github.com/qubic/wallet-extension/commit/54dd420c0359e3d1ceb09bd455d8d5de4a8765e4))
* **popup:** restore explicit popup viewport sizing ([726ee3e](https://github.com/qubic/wallet-extension/commit/726ee3e6854066429a89fed59b4da7d01c803b63))
* prevent submit before balance loading ([e8c7a88](https://github.com/qubic/wallet-extension/commit/e8c7a8803bfb428e737605a3c446f5e5c7a0fd7c))
* **rebase:** resolve post-rebase lint and type issues ([c4547a0](https://github.com/qubic/wallet-extension/commit/c4547a010a8122627ac2ebf746b953868041277d))
* remove unused failedHash query param from resend URLs ([2fc0fcc](https://github.com/qubic/wallet-extension/commit/2fc0fcc933d118e3fa5e6be88a9de4a1603444d8))
* **router:** consolidate route transitions with shared wrapper ([3bf14f8](https://github.com/qubic/wallet-extension/commit/3bf14f859ce4e3effec4bda5984de70c466a2b2b))
* **router:** remove redundant lock guard condition ([371f1a5](https://github.com/qubic/wallet-extension/commit/371f1a5a55f5afbe7b62a5f720f785b11a3fd735))
* **router:** replace leftover motion wrapper with AnimatedRoute ([1635e82](https://github.com/qubic/wallet-extension/commit/1635e82392c993dabdc80067a1e46b484bbef14a))
* **security:** clear sensitive form data after auth and onboarding flows ([c3a19bf](https://github.com/qubic/wallet-extension/commit/c3a19bf2aeed51307acfd761f516fc944e674065))
* **security:** reduce extension attack surface and harden chart styles ([6a95ea6](https://github.com/qubic/wallet-extension/commit/6a95ea63d2a9c18906b63a1a17ad054f65cd8b21))
* **security:** scope wallet reset to wallet-owned storage keys ([bb12e06](https://github.com/qubic/wallet-extension/commit/bb12e06a3712c0c890f7ac48c89f4a628774ac85))
* **shell:** make bottom-nav icon colors theme-aware ([8a4e41b](https://github.com/qubic/wallet-extension/commit/8a4e41bfe747f5d8559c1995aad17866fe9530a7))
* **shell:** polish nav interactions and scrolling behavior ([019a445](https://github.com/qubic/wallet-extension/commit/019a445525eb17c65fffb74a2ba7a8ef0fefb7d4))
* **shell:** prevent global content overlap with bottom nav ([d14c1ba](https://github.com/qubic/wallet-extension/commit/d14c1babd4d4e6eb4db388987c2633dde5d7c4b6))
* **sidepanel:** close popup after opening side panel ([756dfe5](https://github.com/qubic/wallet-extension/commit/756dfe592b1f99dcffd738827947bbbfb1f6b930))
* **sidepanel:** let content expand with sidepanel width ([ec46ee2](https://github.com/qubic/wallet-extension/commit/ec46ee213559d4897e8bc91609be20790e3f8520))
* **storage:** clear dapp and vault mirror state on reset ([7c60625](https://github.com/qubic/wallet-extension/commit/7c6062591ad9545adfe08281239404a43f36f17a))
* **tooling:** type vite reload plugin ([086e849](https://github.com/qubic/wallet-extension/commit/086e849d7666d7bed4cfbdbbefbf2decde947048))
* **transfer:** clear decrypted seed state when wallet locks ([482aca1](https://github.com/qubic/wallet-extension/commit/482aca1b1afa241810078465490f72f5ee55340d))
* **transfer:** format target tick consistently across transfer flow ([5ecdbeb](https://github.com/qubic/wallet-extension/commit/5ecdbeb8793e97422ff39f84792f63046990cb0d))
* **transfer:** format target tick, remove account selector, and minor UI fixes ([738b913](https://github.com/qubic/wallet-extension/commit/738b91391d20716a92f0b00abbf11dcc9000f22e))
* **transfer:** keep failed pending entries until manual delete ([b31dcec](https://github.com/qubic/wallet-extension/commit/b31dcecced842961ed6e5e1596f06050f71e329c))
* **transfer:** prefill resend fields from failed transaction ([38028c2](https://github.com/qubic/wallet-extension/commit/38028c22cc7abfd80ed29b2bd73bd10ba7ba84e0))
* **transfer:** remove pending transaction blocking ([03afd64](https://github.com/qubic/wallet-extension/commit/03afd646cf16f83acfe4a88960c896f2fd815e3b))
* **transfer:** use suggested target tick for chip-based scheduling ([f39fe53](https://github.com/qubic/wallet-extension/commit/f39fe53a1add87d785a0bb9fe9aa6735ce80c191))
* trigger a full page reload after resetting ([9a61d09](https://github.com/qubic/wallet-extension/commit/9a61d090f2e36f3d8290e919022111f3c1f5f704))
* **tx-details:** add back button to transaction details page ([c2dd983](https://github.com/qubic/wallet-extension/commit/c2dd983fcdbd6210759ec7d053ba3644ecad3fd4))
* **tx-details:** format amount without bigint precision loss ([fac083d](https://github.com/qubic/wallet-extension/commit/fac083dcc98503d9c555e763ef0b207691f8e8b7))
* **ui:** add copy button in header, custom send/receive icons, and hide actions for watch-only ([c887a6b](https://github.com/qubic/wallet-extension/commit/c887a6b60b955107b81abb24bf2c29f061983ca5))
* **ui:** add destructive-outline button variant for delete actions ([8e2e8e4](https://github.com/qubic/wallet-extension/commit/8e2e8e4893a0fae9f6b4a53d3cc58a8ec9a33f76))
* **ui:** add eye toggle to vault import and improve input-group border visibility ([6eb2551](https://github.com/qubic/wallet-extension/commit/6eb2551e211f0a35f802ff9efb60bf8deeaf3b8d))
* **ui:** disable extension tab mode entry points ([8e39bdb](https://github.com/qubic/wallet-extension/commit/8e39bdb2e7e477a7db41a730fc4194879fa2680a))
* **ui:** improve watch-only and active badges in home and accounts pages ([86ba588](https://github.com/qubic/wallet-extension/commit/86ba588f9a0c286eee6982df3f737c1d26250003))
* **ui:** make bottom nav theme-aware ([fdcc728](https://github.com/qubic/wallet-extension/commit/fdcc728976e75d3fbdc01039fa5dbbcbeb34406c))
* **ui:** move copy button next to field value in transaction details ([a66e8cf](https://github.com/qubic/wallet-extension/commit/a66e8cf8ac62510645fc72ab2fa3dd8fcbde462e))
* **ui:** remove tab i18n leftovers and widen sidepanel max-width override ([cc5e289](https://github.com/qubic/wallet-extension/commit/cc5e289c1bb8061e7d5ab44742e39895124c443b))
* **ui:** respect bottom nav safe area ([b87075c](https://github.com/qubic/wallet-extension/commit/b87075cb4caa6de969641ac6aeae16d1fa9585ef))
* **ui:** toggle sidepanel button between open and close states ([33b59bb](https://github.com/qubic/wallet-extension/commit/33b59bb4ea967aca1545a24a382dd7863d48d7b6))
* **unlock:** remove identity display from lock screen ([1d38967](https://github.com/qubic/wallet-extension/commit/1d38967603fede2c88ce8926989375590f5a38d6))
* **unlock:** validate passphrase against vault entry ([fe4d678](https://github.com/qubic/wallet-extension/commit/fe4d6789e8e49a3feeb975e55dc2b2fa2bba15a8))
* update data syncing ([#95](https://github.com/qubic/wallet-extension/issues/95)) ([f9c6f53](https://github.com/qubic/wallet-extension/commit/f9c6f53e31865257f7cb1c7d1cac027dbc6f9b31))
* update the send flow to make the confirmation first ([1875d42](https://github.com/qubic/wallet-extension/commit/1875d4212a3818b2bff2b9c0208929c21a65e31c))
* validate always first identity in vault to skip watch only accounts in manage-accounts.tsx ([e203cec](https://github.com/qubic/wallet-extension/commit/e203cec19f9e64270a3e59be972b6cd939a85ec8))
* validate always first identity in vault to skip watch only accounts in unlock.tsx ([49b4e6f](https://github.com/qubic/wallet-extension/commit/49b4e6f8bc8e6749034b89467b28d65c32477c40))
* **vault:** resolve passphrase validation failure when active account is watch-only ([63af6a1](https://github.com/qubic/wallet-extension/commit/63af6a1dce5d498f557e39ebf33eadf916a33e04))
* **vault:** support dapp signing in background worker ([c26e314](https://github.com/qubic/wallet-extension/commit/c26e31412475c266611e6bc28819ac3fd5e6709e))


### Features

* **accounts:** adapt add-address onboarding flows ([88c4cf8](https://github.com/qubic/wallet-extension/commit/88c4cf8f4b6eb60ea45e68aa2981874bb119493f))
* **accounts:** add watch-only screen and routes ([980590d](https://github.com/qubic/wallet-extension/commit/980590d8816492fbb19004488a350697bb7709f5))
* **accounts:** redesign manage accounts flow ([540e5a2](https://github.com/qubic/wallet-extension/commit/540e5a2a514c47b8e290f779dc3016f08296a566))
* add amount in the transfer success page ([9197483](https://github.com/qubic/wallet-extension/commit/9197483e118c71bccd27c60466c6b4562bcf6cbf))
* add basic theme switch to settings page ([1d94a2a](https://github.com/qubic/wallet-extension/commit/1d94a2aada632ec963987701b36b10e32ae0a77e))
* add localization for seedSeucirtyStep page ([dd57680](https://github.com/qubic/wallet-extension/commit/dd57680ddc5f0118f584e7da6bfbc0ec0a89acab))
* add localization for transfer qubics feature ([574398d](https://github.com/qubic/wallet-extension/commit/574398d49878bf2f9837ece19a8f6a29a8b286b9))
* add qrcode for reveal seed ([6e5572b](https://github.com/qubic/wallet-extension/commit/6e5572bc52b3df7476b92fd391e27158ac58a887))
* add qubic dart assets ([9a87114](https://github.com/qubic/wallet-extension/commit/9a87114423be8a02888def47291c6a143f28e85e))
* add security screen for password change and lock timer ([d41978f](https://github.com/qubic/wallet-extension/commit/d41978fab38aed063b7ef71888516cbf326bf2ad))
* add self-send check for sign transaction ([8a0ed13](https://github.com/qubic/wallet-extension/commit/8a0ed13eab52d9c5a77aff6f18f9176bff0122c8))
* add settings screen ([15f625a](https://github.com/qubic/wallet-extension/commit/15f625aabdfcf37adc6d851477ed5e414e01d187))
* add toast feedback for copy private seed button ([9e14cdb](https://github.com/qubic/wallet-extension/commit/9e14cdb9515afef392753bb0a0425abe18291ace))
* add tokens selection input in the transfers screen ([4435cd1](https://github.com/qubic/wallet-extension/commit/4435cd15fa31b050d364e34250d3d6f6e3ffe7bb))
* add transfer qubics screen ([243dc1a](https://github.com/qubic/wallet-extension/commit/243dc1a2ca2d3253aebaf5182fba4144a7f0c1ad))
* complete qx transfer assets functionality ([299f9ee](https://github.com/qubic/wallet-extension/commit/299f9ee6de14380d94ebc99634a7322514bb7a78))
* **dapp:** add per-account permissions for connected dApps ([76331df](https://github.com/qubic/wallet-extension/commit/76331dfb6564b4584f8808889a49405aed81b3d4))
* **dapp:** add sendTransaction with target tick offset ([6668445](https://github.com/qubic/wallet-extension/commit/66684454604bb719007c35adfa2980dcd6a049da))
* **dapp:** add window.qubic bridge background router and signing flow ([3fb4495](https://github.com/qubic/wallet-extension/commit/3fb4495905fb489914e9fbecac4a86eb27b383b6))
* **dapp:** persist approval requests across worker restarts ([bca5c75](https://github.com/qubic/wallet-extension/commit/bca5c75689cc0b69cf9b33926d43fe78b761ae12))
* **dapp:** show account and fee in approval drawers ([772aba2](https://github.com/qubic/wallet-extension/commit/772aba2a6c2e532557a1666af3964076e0ce30fb))
* **dapp:** track sendTransaction in pending tx state ([d4a8146](https://github.com/qubic/wallet-extension/commit/d4a8146dfd15fe8a296b04ef658a5795e6c5efaa))
* export vault file ([b5c1cf7](https://github.com/qubic/wallet-extension/commit/b5c1cf7e0ed56969d2013b2a84cb09123daf5673))
* **extension:** 8 bundle geist mono font ([cdb858f](https://github.com/qubic/wallet-extension/commit/cdb858f9380e05620ba981d96006ba6e7720ad34))
* **extension:** add shadcn ui, routes, and dev workflow ([29dc454](https://github.com/qubic/wallet-extension/commit/29dc4549b29c22ca7873df79e9477f70de906d66))
* **extension:** add side panel and refine shell ([b4f07db](https://github.com/qubic/wallet-extension/commit/b4f07db3fecbe5c05b9074066f90dd1d39a5f6ed))
* **extension:** add tab mode and header component ([1f5ba8e](https://github.com/qubic/wallet-extension/commit/1f5ba8e6965bc4aceb695e199f63b69a28c8fab1))
* **extension:** add theme-aware action icon sync ([4ec197f](https://github.com/qubic/wallet-extension/commit/4ec197f85b257c53aa8aa70a4e4ecb3c1d31b578))
* **extension:** reload dev surfaces ([a96e6ee](https://github.com/qubic/wallet-extension/commit/a96e6eee6088e151966a18be8ed768ad9b459c60))
* **extension:** scaffold extension popup with router and i18n ([09e03a2](https://github.com/qubic/wallet-extension/commit/09e03a20f41cb78f63a8bde67f5fd9643c0b84ef))
* **history:** add infinite scroll and row skeleton loading ([d867839](https://github.com/qubic/wallet-extension/commit/d867839b2e1c86bd0cb98d65bcd913be2256dbe2))
* **history:** group transactions by date sections ([5b3886c](https://github.com/qubic/wallet-extension/commit/5b3886ca7a73a01462088457d49044da2535f9d7))
* **home:** show live QUBIC price and simplify home screen layout ([4661d5b](https://github.com/qubic/wallet-extension/commit/4661d5b9ec9e75e9fba40d35ceb69acb81308e2a))
* **i18n:** add history date group and timestamp translation keys ([687f522](https://github.com/qubic/wallet-extension/commit/687f522a5730821e039375591b735d69fe966786))
* implement vault import/export using qubic-ts-library ([8571f36](https://github.com/qubic/wallet-extension/commit/8571f36350fe11a50665e87d0e9f89060b0fd32d))
* move passphrase auth component into a separate reusable component ([2185956](https://github.com/qubic/wallet-extension/commit/2185956e9418f024d4c1252c0cff179a0039986e))
* **onboarding:** add seed confirmation and password checks to create wallet flow ([5e441a6](https://github.com/qubic/wallet-extension/commit/5e441a6e080ff42324ae2e1ef547ddca5d40aa6d))
* **popup:** 8 polish screens and navigation ([30f2396](https://github.com/qubic/wallet-extension/commit/30f239615ad89a4db4f90e68672498bf821fb0de))
* **popup:** enhance history list ([435b335](https://github.com/qubic/wallet-extension/commit/435b335bc10baa71ff869b347f8a4e0f09e61563))
* **popup:** localize home ui ([89dbaef](https://github.com/qubic/wallet-extension/commit/89dbaefcdfa243fa5a20bf3baf8b03c3ae6cefff))
* **popup:** refine home screen and toasts ([2c2675a](https://github.com/qubic/wallet-extension/commit/2c2675a886f94f351134c0c9dc77c79a1408ddac))
* remove the border from cards ([de95b30](https://github.com/qubic/wallet-extension/commit/de95b3078dc370bbbc32f21dec386e2d5f95bc15))
* remove the transfer success page and update the toaster position and duration ([528f2c6](https://github.com/qubic/wallet-extension/commit/528f2c6fff260ff33e0103bd741257416d2f3681))
* remove unused watch-only flag from select token page ([68bdd18](https://github.com/qubic/wallet-extension/commit/68bdd18c20432f3f94f911bd5223de80a1d63936))
* resolve address names and SC procedures in transaction views ([#91](https://github.com/qubic/wallet-extension/issues/91)) ([f4bd4b8](https://github.com/qubic/wallet-extension/commit/f4bd4b87e1ae81f115bd42c8526bec0cc5632ab2))
* **settings:** add dapp approval drawer and connected sites management ([d9d0c47](https://github.com/qubic/wallet-extension/commit/d9d0c478f138d62ff11f08094e521b9c6fdb1c94))
* **settings:** move language and theme to General sub-page ([5d959c9](https://github.com/qubic/wallet-extension/commit/5d959c92a175e7f73172daf83ba2c9aadf8df5a4))
* **shared:** 8 add vault onboarding flow and routing ([3b56143](https://github.com/qubic/wallet-extension/commit/3b561439939d5661e83ce5bc10c95f07c8ca2c66))
* **shared:** add history translations ([dd6f5b4](https://github.com/qubic/wallet-extension/commit/dd6f5b4cb7e19e33569cbfc6f762b21244a50bb6))
* **shared:** add transfer route and account selection ([893d8b4](https://github.com/qubic/wallet-extension/commit/893d8b4e5a50e455f9c78516d5827f3d61333a5d))
* **shell:** redesign header and bottom navigation interactions ([3386091](https://github.com/qubic/wallet-extension/commit/338609136bbda351028fb97fb3e62d9ca4e9b546))
* show balances in account selector ([3346606](https://github.com/qubic/wallet-extension/commit/33466063f82cce8c12917a7060ef2ecc899ee844))
* split select token into a separate step in transfer ([24b7ccc](https://github.com/qubic/wallet-extension/commit/24b7cccf0f01e9337e0160deb8a2f7bf02e46981))
* switch font and unlock after onboarding ([6fbc280](https://github.com/qubic/wallet-extension/commit/6fbc28020eb4efd389390c7aa1f7d0f62c8a7d1b))
* **transactions:** add tx details flow and refresh home/history UX ([1dedf75](https://github.com/qubic/wallet-extension/commit/1dedf75643cf1eb2dc4996ff0612d610b7f38923))
* **transactions:** add tx details skeleton loading state ([d551a71](https://github.com/qubic/wallet-extension/commit/d551a71f005910af2ab04feed097f08b26c1ca28))
* **transactions:** use custom icons, sent/received labels, and timestamp display ([96d3f2b](https://github.com/qubic/wallet-extension/commit/96d3f2b6d39a0666fc144713ea60e5e06963c2df))
* transfer assets rights ([#103](https://github.com/qubic/wallet-extension/issues/103)) ([286f424](https://github.com/qubic/wallet-extension/commit/286f424a49752d5d8bd0adafa99b757c05b38611))
* transfer assets that are managed by qx only ([ba8b9df](https://github.com/qubic/wallet-extension/commit/ba8b9dfe46d2532a81a39174075145316a339da9))
* **transfer:** add target tick controls and pending-send guard ([446c274](https://github.com/qubic/wallet-extension/commit/446c274ad32b2514e6bbbd306697e5dca31f9b58))
* **tx-details:** add timestamp field and format amount and tick ([d866246](https://github.com/qubic/wallet-extension/commit/d8662465024d0737d59cca1276d388d0163ad189))
* **ui:** remove accounts tab from nav bar and improve settings layout ([fa4bbd7](https://github.com/qubic/wallet-extension/commit/fa4bbd719c7a02783e40be684f66dd57e767934d))
* update global css with qubic themes ([54f5904](https://github.com/qubic/wallet-extension/commit/54f590462aae61208e8e9bacbe76004ad1fc3ff8))
* update home actions (send, recieve) icons to align with mobile icons ([ccf8a36](https://github.com/qubic/wallet-extension/commit/ccf8a363e48057a8b2cf9477682f83238067cc9f))
* update localization for fee ([febb3f9](https://github.com/qubic/wallet-extension/commit/febb3f9346f474aa6b7ee2d420709e5576f1dd36))
* update transfer screen ui ([8f3db4d](https://github.com/qubic/wallet-extension/commit/8f3db4dcffa33eecd93cfec50f503b088f59844b))
* use colors from qubic theme instead of hardcoding values ([749f86f](https://github.com/qubic/wallet-extension/commit/749f86f059cf2b98f3e9e6650eda367f04f4af02))


---

## Install (Chrome / Chromium)

1. Download **wallet-extension-dist.zip** from the assets below
2. Unzip to a folder
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the unzipped folder
7. Pin the extension from the puzzle icon in the toolbar

### Updating to a new version

1. Download the new **wallet-extension-dist.zip**
2. Unzip and **replace the files in the same folder** you loaded originally
3. Go to `chrome://extensions` and click the reload button on the extension

> **Important:** Do not remove and re-load from a different folder — this changes the extension ID and you will lose your accounts and settings.

# Changelog

All notable changes to this project will be documented in this file.
