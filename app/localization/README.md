# Localization

Português (pt-BR), English (en), 简体中文 (zh-CN). Chinese uses Simplified Chinese.
catalog.json is generated from inventory.json, translations.tsv and extras.tsv with build.py.
The app applies translations to text and accessible labels while keeping control IDs and numeric values unchanged.
Native variants use BRUXOS_LANGUAGE=0/1/2 and preserve AE disk IDs and OFX plugin/parameter/clip IDs. Install one language edition per host; editions replace one another.
Photoshop preserves its UXP manifest ID and profiles; select one fixed-language panel package.

ChineseSimplified.isl is the contributed Inno Setup translation distributed by the Inno Setup project: https://github.com/jrsoftware/issrc/blob/main/Files/Languages/ChineseSimplified.isl
Original headers and attribution remain in the file. Official distribution index: https://jrsoftware.org/files/istrans/
