# Публикация рабочей версии 1.3.0 в Mozilla

Эти тексты относятся только к готовой версии 1.3.0. Общая онлайн-галерея и автоматическая загрузка оформления владельца профиля находятся в разработке и не входят в этот пакет.

## Загружаемые файлы

- Расширение: [psichopodobny-winter-firefox-v1.3.0-unsigned.zip](https://github.com/psichopodobny/psichopodobny/raw/refs/heads/main/profile-theme/studio/dist/psichopodobny-winter-firefox-v1.3.0-unsigned.zip)
- Исходники: [psichopodobny-winter-firefox-v1.3.0-source.zip](https://github.com/psichopodobny/psichopodobny/raw/refs/heads/main/profile-theme/studio/dist/psichopodobny-winter-firefox-v1.3.0-source.zip)

В поле исходников выбери ZIP целиком, не распаковывая его. Если в текущей отправке загружено расширение 1.2, эти описания и исходники не подходят: сначала выбери пакет 1.3 в соответствующем шаге загрузки версии. Не создавай дубликат уже существующего дополнения с тем же ID: следующая версия загружается через управление версиями этого дополнения.

## Название

```text
Winter Profile Studio - GitHub Themes
```

## URL дополнения

Существующий адрес `winter-profile-github-themes` можно оставить. Изменение адреса не требуется для обновления описания.

## Сводка

```text
Редактор GitHub-профилей: шесть тем, свои фоны и шрифты, аватары, анимированные рамки и обмен оформлением через JSON.
```

## Описание

```text
Winter Profile Studio позволяет настроить внешний вид личных GitHub-профилей в своём браузере.

В редакторе есть шесть готовых тем: Frost, Midnight, Neon, Aurora, uikole и Ember. Любую тему можно изменить: выбрать фон и шрифт, настроить два цвета рамки, её форму и скорость анимации, затемнение, размытие и снег. Изменения видны в живом предпросмотре.

Можно загрузить собственные фоны и аватары в PNG, JPG или WebP, а также шрифты TTF, OTF, WOFF и WOFF2. Для выбранного профиля доступны локальные изменения отображаемого имени, описания, заголовка и текста о себе. Настоящий ник и ссылки GitHub сохраняются.

Оформление можно применять ко всем личным профилям или сохранять отдельно для конкретного ника. Внешний вид меняется только в браузере с расширением; аккаунты и репозитории на сервере GitHub не редактируются. На страницах авторов доступны дополнительные готовые компоновки.

Свою тему можно скачать в JSON, передать другому человеку и импортировать в его редактор. Аватар и личный текст включаются в экспорт только отдельным переключателем. В этой версии нет общей онлайн-галереи и автоматического показа тем, опубликованных владельцами других профилей.

Настройки, изображения и шрифты сохраняются локально. Нет аналитики, доступа к паролям или токенам. Анимацию можно отключить; учитывается системная настройка уменьшения движения.

Проект psichopodobny и uikole. Независимое расширение, не связанное с GitHub или Mozilla.
```

## Переключатели и ссылки

- «Это дополнение экспериментальное»: включить. Выпуск предварительный; работа в установленном Firefox ещё не проверена.
- «Требует оплаты…»: выключить.
- Категория: «Внешний вид». Остальные категории можно не выбирать.
- Почта поддержки: необязательное поле, можно оставить пустым.
- Сайт поддержки: `https://github.com/psichopodobny/psichopodobny/issues`
- Лицензия: MIT для кода. Сторонние изображения перечислены отдельно в ARTWORK.md и не становятся MIT-материалами.
- «Имеет политику приватности»: включить и вставить текст ниже.

## Политика приватности

```text
Winter Profile Studio 1.3.0

Расширение не передаёт настройки, изображения, шрифты или изменённые тексты авторам программы и не использует аналитику.

Для оформления открытой страницы расширение обрабатывает её содержимое и ник GitHub локально. Настройки, отдельные темы по никам, загруженные фоны, аватары, шрифты и локальные тексты хранятся в browser.storage.local. В редакторе, открытом как отдельный локальный HTML-файл, черновик хранится в localStorage этого браузера. История посещений не ведётся. Пароли, cookies и токены аккаунта не запрашиваются.

При экспорте пользователь самостоятельно скачивает JSON-файл темы. Файл может содержать активный фон и загруженный шрифт. Аватар и личный текст включаются только при включённой соответствующей опции. Список сохранённых профилей не экспортируется. Передача файла другому человеку выполняется самим пользователем.

Импортированный JSON проверяется. Пользовательские JavaScript, HTML, CSS и удалённые URL фонов не выполняются и не загружаются.

Расширение 1.3.0 не загружает публичные темы других владельцев автоматически и не обращается к серверу галереи. Открытие сайта GitHub по ссылке подчиняется политике этого сайта. Отдельный Windows-помощник не входит в Firefox-пакет; его проверка ссылок на магазины описана отдельно в документации проекта.

Настройки можно сбросить в редакторе. Контакт по вопросам расширения: https://github.com/psichopodobny/psichopodobny/issues
```

## Примечания для проверяющих

```text
Version: 1.3.0. This is the local Studio preview, not the future community/gallery release.

The extension styles individual GitHub profile pages while preserving the real login and repository links. Test https://github.com/octocat. The author profile and the explicitly themed shared repository have packaged alternative layouts. Other repository and system pages are excluded. Disabling the extension restores original page nodes and image attributes.

Open the action popup and select Studio. Test the six presets, per-profile settings, image/font uploads, animated frames, local text overrides, reset and JSON import/export. Personal avatar/text fields require a specific profile. Exports omit these fields unless explicitly selected. JSON never runs custom scripts, HTML or CSS. Custom fonts are loaded as binary FontFace data. Settings remain in browser.storage.local. The standalone local editor uses localStorage and file export instead of direct extension access.

There is no analytics, telemetry, remote executable code, online theme gallery or automatic downloading of other users' themes in version 1.3.0. The separate Windows helper is not part of this Firefox add-on and is not required.

The attached matching source ZIP contains extension/, build.py, README-BUILD.md and expected-firefox.json. Requirements: Python 3.9+ and Node.js 24+ on PATH; tested on Windows with Python 3.12 and Node 24.22.1. Run python build.py from the extracted source directory. No npm dependencies or network access are needed. The generated firefox/ directory reproduces all 29 uncompressed files of the submitted package byte for byte. Only Firefox manifest settings are adapted from the cross-browser source; there is no minification, bundling or transpilation.

The Firefox package passed addons-linter 10.15.0 with zero errors and warnings. Isolated Chromium extension tests and public GitHub checks passed. Runtime testing in Firefox has not yet been performed. No login or test credentials are required for public profiles. Third-party artwork is documented in ARTWORK.md; the MIT license applies to code, not third-party illustrations.
```
