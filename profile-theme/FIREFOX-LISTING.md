# Данные для Firefox Add-ons

## Название

Winter Profile - GitHub Themes

## Краткое описание

Зимнее оформление любого личного GitHub-профиля: свой фон, снег, рамка аватара, цвет акцента и анимация при прокрутке.

## Описание

Winter Profile добавляет живой зимний фон и оформление личных профилей GitHub. Имя, аватар, описание, README, репозитории и статистика открытого профиля сохраняются.

Настройки доступны через значок расширения: зимний лес или туманное озеро, собственное изображение для фона, цвет акцента и шрифт заголовков. Можно отдельно отключить движение и снег или вернуть обычный GitHub. Учитывается системная настройка уменьшения движения.

Можно настроить общий вид всех профилей или отдельную тему для выбранного ника. Оформление сохраняется в файл JSON и загружается у другого пользователя. В файл входят параметры и активная картинка; список профилей и данные аккаунта не экспортируются.

Настройки действуют только в браузере пользователя. Изменения не записываются в аккаунты GitHub и не публикуются от имени владельцев просматриваемых профилей. На двух страницах автора доступна отдельная компоновка: psichopodobny и общий репозиторий psichopodobny and uikole.

Нет аналитики, внешних скриптов, запросов к API или доступа к cookies и токенам. Настройки и загруженный фон остаются в локальном хранилище браузера.

## Ссылки

- Главная: https://github.com/psichopodobny/psichopodobny/tree/main/profile-theme
- Поддержка: https://github.com/psichopodobny/psichopodobny/issues
- Политика данных: https://github.com/psichopodobny/psichopodobny/blob/main/profile-theme/FIREFOX-PRIVACY.md
- Лицензия исходного кода: MIT. Предоставленные сторонние иллюстрации исключены из лицензии кода; источники перечислены в ARTWORK.md.

## Notes for Reviewers

This extension styles personal GitHub profile pages. Test any public individual profile, for example github.com/octocat. Names, biographies, README content, repository links and statistics remain native. Repository and system pages are excluded, except the author's explicitly themed shared repository.

The author profile github.com/psichopodobny and the shared repository github.com/psichopodobny/psichopodobny-and-uikole use a separate packaged layout. The native DOM is kept and is restored with the Ordinary GitHub button.

Use the action popup to change background preset, upload a local image, change accent/font, disable motion/snow and reset settings. Local uploads are converted to a static WebP image and stored in browser.storage.local. No network upload is made. Reduced motion is respected.

The popup can apply appearance globally or to a manually selected profile. The current profile nickname is read through an internal content-script message, with no tab URL or history collection. Local per-profile settings inherit global defaults. Theme export/import uses a restricted JSON schema, includes only appearance and the active background image, and never executes user-provided scripts or CSS. The saved profile map and master enabled flag are excluded from exports.

The attached source archive contains the original cross-browser source and build.cjs, which performs the Firefox-specific manifest/API adaptation and writes dist/firefox. Run `node build.cjs` with Node.js 24.14.0 or later. No npm install or network access is needed. The build verifies that all 22 output files match the submitted extension byte for byte. There is no compilation, minification, bundler, background script or remote executable code. All illustration resources are packaged. The local addons-linter 10.15.0 report has zero errors and warnings. Firefox manifest/API unit checks pass; production Firefox runtime testing has not yet been performed. No login or test credentials are needed to view public profiles.
