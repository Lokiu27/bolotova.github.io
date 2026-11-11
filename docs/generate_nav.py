#!/usr/bin/env python3
"""Генерация секции nav в mkdocs.yml из структуры контента курса (BA_Course).

Скрипт запускается перед `mkdocs build` — в CI (job build-course) и локально
(см. DEPLOY.md). Он читает свежий контент курса, собирает nav и записывает его
в переданную копию mkdocs.yml (репозиторный docs/mkdocs.yml не трогается:
секции nav в нём нет вообще). Ручная синхронизация nav со структурой курса
больше не нужна: новый файл урока попадает в меню при следующей же сборке.

Правила сборки nav:
  - первым — внешний линк «← На основной сайт»;
  - раздел «Курс»: index.md («Введение»), каталоги modul-N по номеру
    (modul-10 после modul-9), корневые .md натуральной сортировкой, затем
    прочие каталоги с .md-файлами (materialy → «Материалы»);
  - каталог с одним index.md — лист; каталог с несколькими .md — подраздел
    (index.md первым, далее натуральная сортировка: tema-2 < tema-10);
  - названия пунктов — первый H1 страницы; NAV_TITLES ниже задаёт короткие
    подписи, когда H1 длиннее нужного (текущие подписи меню сохранены 1:1);
  - каталоги без .md-файлов (assets с картинками и т.п.) пропускаются молча;
    README.md исключён (дублирует not_in_nav в mkdocs.yml);
  - о неожиданных файлах и каталогах — предупреждение в лог, чтобы новое
    содержимое не пропало из меню незамеченным.

Ненулевой код возврата — только если nav собрать нельзя (нет контента или
index.md). Предупреждения сборку не роняют.
"""

import argparse
import os
import re
import sys
from pathlib import Path

import yaml

SITE_URL = "https://bolotova.online"
COURSE_SECTION = "Курс"

# Короткие подписи nav: H1 этих страниц длиннее принятых в меню. Ключ —
# путь от корня контента. Новые уроки (tema-N) сюда добавлять не нужно —
# им достаточно H1.
NAV_TITLES = {
    "index.md": "Введение",
    "itogovyy-proekt.md": "Итоговый проект",
    "materialy/shablon-reestra-steykholderov.md": "Шаблон. Реестр стейкхолдеров",
    "materialy/pravovaya-spravka-rf.md": "Правовая справка. AI и законодательство РФ",
}

# Названия разделов для каталогов без index.md (materialy — не страница,
# а группа страниц)
SECTION_TITLES = {
    "materialy": "Материалы",
}

# Порядок внутри каталога, если он отличается от натуральной сортировки имён
# (в materialy шаблон идёт раньше справки, хотя «п» < «ш»). Перечисленные
# файлы встают первыми, остальные — за ними по алфавиту.
NAV_PINNED = {
    "materialy": ["shablon-reestra-steykholderov.md"],
}

# Ожидаемые корневые .md кроме index.md; о прочих — предупреждение
EXPECTED_ROOT_FILES = {"itogovyy-proekt.md"}

# README.md BA_Course — инструкции для авторов, не страница курса
EXCLUDED = {"README.md"}

MODULE_RE = re.compile(r"^modul-(\d+)$")

warnings: list[str] = []


def natural_key(name: str):
    """Ключ сортировки, при котором tema-2 < tema-10 и modul-2 < modul-10."""
    parts = re.split(r"(\d+)", name)
    return tuple((0, int(p), "") if p.isdigit() else (1, 0, p) for p in parts)


def first_h1(path: Path):
    """Первый H1 страницы; front-matter (если появится) пропускается."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        warnings.append(f"не удалось прочитать {path}: {exc}")
        return None
    lines = text.splitlines()
    if lines and lines[0].strip() == "---":
        try:
            lines = lines[lines.index("---", 1) + 1:]
        except ValueError:
            pass
    for line in lines:
        match = re.match(r"^# (.+?)\s*$", line)
        if match:
            return match.group(1)
    return None


def page_title(rel: str, root: Path) -> str:
    """Название пункта nav: короткая подпись из NAV_TITLES, иначе первый H1."""
    if rel in NAV_TITLES:
        return NAV_TITLES[rel]
    h1 = first_h1(root / rel)
    if h1:
        return h1
    warnings.append(f"у {rel} нет H1 — в nav использовано имя файла")
    return Path(rel).stem


def has_md(path: Path) -> bool:
    """Есть ли в каталоге хоть один .md (каталоги картинок в nav не входят)."""
    return any(p.name not in EXCLUDED for p in path.rglob("*.md"))


def md_files(root: Path, subdir: str):
    """.md каталога: NAV_PINNED первыми, затем натуральная сортировка."""
    names = [
        n for n in os.listdir(root / subdir)
        if n.endswith(".md") and n not in EXCLUDED and not n.startswith(".")
    ]
    pinned = [n for n in NAV_PINNED.get(subdir, []) if n in names]
    rest = sorted((n for n in names if n not in pinned), key=natural_key)
    return pinned + rest


def dir_section(root: Path, subdir: str):
    """Nav-пункт для каталога: лист (только index.md) или подраздел."""
    files = md_files(root, subdir)
    if not files:
        return None

    # Каталог с одной страницей — просто пункт меню
    if files == ["index.md"]:
        rel = f"{subdir}/index.md"
        return {page_title(rel, root): rel}

    # Несколько страниц — подраздел; index.md первым (сортировка уже так)
    children = [{page_title(f"{subdir}/{n}", root): f"{subdir}/{n}"} for n in files]

    # Вложенные каталоги с .md (сейчас в курсе не используются) — в конец
    for name in sorted(os.listdir(root / subdir), key=natural_key):
        nested = root / subdir / name
        if not nested.is_dir() or name.startswith(".") or not has_md(nested):
            continue
        warnings.append(f"вложенный каталог {subdir}/{name}/ добавлен в nav как подраздел")
        sub = dir_section(root, f"{subdir}/{name}")
        if sub:
            children.append(sub)

    index_rel = f"{subdir}/index.md"
    if subdir in SECTION_TITLES:
        title = SECTION_TITLES[subdir]
    else:
        h1 = first_h1(root / index_rel) if (root / index_rel).is_file() else None
        title = h1 or subdir
        if not h1:
            warnings.append(f"у каталога {subdir}/ нет index.md с H1 — название раздела взято из имени каталога")

    if index_rel in files and page_title(index_rel, root) == title:
        warnings.append(
            f'{index_rel}: название пункта совпадает с названием раздела "{title}" — '
            'задайте короткую подпись в NAV_TITLES (например, "О разделе")'
        )
    return {title: children}


def build_nav(root: Path):
    """Собирает значение секции nav по правилам из описания скрипта."""
    nav = [{"← На основной сайт": SITE_URL}]

    if not (root / "index.md").is_file():
        raise SystemExit(f"ОШИБКА: в {root} нет index.md — стартовая страница курса обязательна")

    course = [{page_title("index.md", root): "index.md"}]

    # Каталоги модулей — по номеру; прочие каталоги с .md — после корневых страниц
    modules, others = [], []
    for name in os.listdir(root):
        path = root / name
        if not path.is_dir() or name.startswith(".") or not has_md(path):
            continue
        match = MODULE_RE.match(name)
        if match:
            modules.append((int(match.group(1)), name))
        else:
            others.append(name)

    for _, name in sorted(modules):
        entry = dir_section(root, name)
        if entry:
            course.append(entry)

    # Корневые страницы (itogovyy-proekt.md и возможные новые)
    root_files = sorted(
        (
            n for n in os.listdir(root)
            if n.endswith(".md") and n != "index.md" and n not in EXCLUDED and not n.startswith(".")
        ),
        key=natural_key,
    )
    for name in root_files:
        if name not in EXPECTED_ROOT_FILES:
            warnings.append(f"неожиданный корневой файл {name} — добавлен в раздел «{COURSE_SECTION}»")
        course.append({page_title(name, root): name})

    # Прочие каталоги с .md — разделами в конец (материалы и возможные новые)
    for name in sorted(others, key=natural_key):
        if name not in SECTION_TITLES:
            warnings.append(f"неожиданный каталог {name}/ — добавлен разделом в «{COURSE_SECTION}»")
        entry = dir_section(root, name)
        if entry:
            course.append(entry)

    nav.append({COURSE_SECTION: course})
    return nav


def main():
    parser = argparse.ArgumentParser(
        description="Собрать nav в mkdocs.yml из структуры контента курса",
    )
    parser.add_argument("--content", required=True, help="корень контента курса (клон BA_Course)")
    parser.add_argument("--config", required=True, help="mkdocs.yml, куда записать nav (копия, не репозиторный)")
    args = parser.parse_args()

    root = Path(args.content)
    if not root.is_dir():
        raise SystemExit(f"ОШИБКА: каталог контента не найден: {root}")

    nav = build_nav(root)

    config = Path(args.config)
    cfg = yaml.safe_load(config.read_text(encoding="utf-8"))
    if not isinstance(cfg, dict):
        raise SystemExit(f"ОШИБКА: {config} не похож на mkdocs.yml")
    cfg["nav"] = nav
    config.write_text(
        yaml.safe_dump(cfg, allow_unicode=True, sort_keys=False, default_flow_style=False, width=4096),
        encoding="utf-8",
    )

    print(f"nav записан в {config}:")
    print(yaml.safe_dump(nav, allow_unicode=True, sort_keys=False, width=4096).rstrip())
    if warnings:
        print("\nПредупреждения:", file=sys.stderr)
        for warning in warnings:
            print(f"  - {warning}", file=sys.stderr)


if __name__ == "__main__":
    main()
