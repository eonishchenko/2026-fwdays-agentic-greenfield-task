# DESIGN.md

Дизайн-рішення для генератора рахунків/актів.  
Вимоги: [docs/requirements.md](./docs/requirements.md) · наратив: [docs/product-brief.md](./docs/product-brief.md) · сире ТЗ: [docs/prd_draft.md](./docs/prd_draft.md).

---

## 1. Цілі дизайну

1. Провести користувача від порожнього сеансу до PDF без зайвих екранів.
2. Зберегти візуальну вірність існуючих HTML-шаблонів A4.
3. Зробити стан відновлюваним за `guid` (чернетка = посилання).

---

## 2. Архітектура (високий рівень)

```
Browser (wizard + preview)
        │
        ▼
Next.js App Router  ──►  Document Service  ──►  FS JSON store
        │                      │
        │                      ├── docs/{guid}.json
        │                      ├── contacts/{inn}.json
        │                      ├── jobs/services.json
        │                      └── {year}/doc_number.json
        ▼
Template Engine (fill HTML) ──► PDF renderer (HTML→PDF)
        ▲
        └── templates/invoce.html | complete.html
```

**Стек (рішення):** Next.js (App Router) + TypeScript. Дані MVP — файлова система поруч із застосунком (або виділений data-root), без зовнішньої БД. Це відповідає BC-04 і спрощує демо/локальний запуск.

**Чому не БД:** обсяг даних малий (контакти, послуги, сеанси); файли зручно інспектувати й бекапити; PRD уже фіксує шляхи JSON.

---

## 3. Модель даних

### 3.1 Document session — `docs/{guid}.json`

```ts
type DocType = "invoice_act" | "invoice" | "act";

type ContactRef = {
  inn: string; // РНОКПП, ключ у contacts/
  // snapshot полів на момент документа (щоб PDF не «поплив» після правки контакту)
  fullName: string;
  phone: string;
  acc: string;
  bank: string;
  mfoBank: string;
  addr: string;
};

type ServiceLine = {
  short_name: string;
  name: string;
  done_amount: number;
  price: number;
};

type DocumentSession = {
  guid: string;
  docType: DocType;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  completed: boolean;
  date: string; // ISO date
  invoiceNumber?: string; // "Р-0000001"
  actNumber?: string;     // "1"
  client?: ContactRef;
  doneBy?: ContactRef;
  services: ServiceLine[];
  copiedFrom?: string;
  updatedAt: string;
};
```

**Рішення:** у сеансі зберігаємо snapshot контактів, а не лише `inn`. Каталог `contacts/` — для вибору наступного разу; історичний PDF лишається стабільним.

### 3.2 Contact — `contacts/{РНОКПП}.json`

Поля: `fullName`, `inn`, `phone`, `acc`, `bank`, `mfoBank`, `addr`.

### 3.3 Services catalog — `jobs/services.json`

Масив послуг з полями `short_name`, `name`, і опційно останні `done_amount` / `price` як підказки (рядки документа все одно копіюються в сеанс).

### 3.4 Numbering — `{year}/doc_number.json`

```ts
type DocNumberState = {
  year: number;
  lastInvoiceSeq: number; // → Р-{7 digits}
  lastActSeq: number;     // → decimal string
};
```

Номери видаються на кроці 2 (або при першому збереженні кроку 2) і не перегенеровуються при поверненні «Назад», якщо вже призначені в сеансі (NFR-04).

---

## 4. Маршрутизація й навігація флоу

| Route | Призначення |
|-------|-------------|
| `/` | Старт: створити новий `guid` → redirect на `/docs/{guid}` |
| `/docs/[guid]` | Єдиний URL флоу + перегляду |

**Рішення:** один URL на сеанс (FR-02). Крок — поле `currentStep` у JSON, не окремі path-сегменти. Це спрощує «поділитися чернеткою» і відповідає PRD.

**Відновлення:**

- `completed === false` → рендер кроку `currentStep` (або першого незаповненого, якщо дані кроку порожні).
- `completed === true` → фінальний перегляд (крок 7 / view mode) з PDF і «Редагувати».

**Копіювання (FR-04):** новий `guid`, deep-copy полів без `invoiceNumber` / `actNumber`; на кроці 2 — нова нумерація.

---

## 5. Кроки UI

| Step | UI | Валідація перед «Далі» |
|------|----|------------------------|
| 1 | Radio: рахунок+акт / рахунок / акт; поле «guid для копіювання» | Обрано тип або успішне копіювання |
| 2 | Date picker; read-only номери після генерації | Валідна дата |
| 3 | Пошук контакту + форма створення замовника | Усі обов’язкові поля контакту, валідний РНОКПП |
| 4 | Те саме для виконавця | Як крок 3 |
| 5 | Список каталогу, чекбокси/додавання рядків, «додати ще» | ≥ 1 послуга з кількістю й ціною |
| 6 | Preview HTML (iframe або sanitized HTML) | Шаблони успішно заповнені |
| 7 | Read-only картки документів + PDF + Назад | — |

Прогрес: горизонтальний ряд кружків 1…7; поточний — акцент; пройдені — заповнені; майбутні — контур (FR-18, NFR-02).

---

## 6. Шаблони й PDF

### 6.1 Заповнення

Шаблони вже містять CSS-класи-якорі (`client-fullName`, `doneBy-inn`, `amount-cursive`, …).  
**Рішення:** заповнення через підстановку тексту в елементи за селектором класу (не Mustache-синтаксис у файлах). Зберігаємо pixel-вірність існуючих `templates/*.html`.

Префікси:

- `client-*` — замовник  
- `doneBy-*` — виконавець  
- `amount-cursive` — сума прописом (uk, гривня)

Рядки таблиці послуг: клонувати row-шаблон або рендерити таблицю з даних сеансу (уточнити по розмітці `invoce.html` / `complete.html` під час імплементації).

### 6.2 PDF

**Рішення:** серверний HTML→PDF (напр. Playwright/Puppeteer або `@react-pdf` лише якщо відмовимось від HTML-шаблонів). Для вірності A4 пріоритет — друк тих самих HTML з `@page { size: A4 }`.

Ендпоінти (орієнтир):

- `GET /api/docs/[guid]/pdf?type=invoice|act`
- `GET /api/docs/[guid]` — JSON стану (опційно)

---

## 7. Візуальний дизайн (продуктовий UI)

Не плутати з виглядом PDF (там — чорно-білий Arial з шаблонів).

| Токен | Рішення |
|-------|---------|
| Фон | Світло-сірий / off-white (`#F5F6F8`), без градієнтного «AI-look» |
| Поверхні | Білі панелі кроку, тонка нейтральна межа (`#E2E4E8`) |
| Текст | Темно-графітовий (`#1A1D21`), вторинний `#5C6370` |
| Акцент | Приглушений синьо-сірий (`#3D5A80`) для прогресу й primary CTA — не фіолетовий |
| Шрифт UI | Читабельний grotesque з чіткою кирилицею (напр. IBM Plex Sans / Source Sans 3); у PDF лишається Arial з шаблону |
| Кнопки | Прямокутні з невеликим radius (4–6px), не pills |
| Прогрес | Кружки з номером кроку; без іконок-емодзі |

Атмосфера: канцелярія / фінанси, не лендінг. Один стовпчик форми, preview документа — поруч на широких екранах (крок 6–7), знизу на мобільному.

---

## 8. Ключові алгоритми

### 8.1 Нумерація

```
on confirm step 2:
  year = yearOf(session.date)
  state = readOrInit(`{year}/doc_number.json`)
  if session needs invoice and !session.invoiceNumber:
    state.lastInvoiceSeq += 1
    session.invoiceNumber = `Р-${pad7(state.lastInvoiceSeq)}`
  if session needs act and !session.actNumber:
    state.lastActSeq += 1
    session.actNumber = String(state.lastActSeq)
  write state + session
```

### 8.2 Сума прописом

`total = Σ(done_amount * price)` → український пропис гривень і копійок у форматі, сумісному з рядком шаблону («Всього на суму: …»).

### 8.3 «Останній незаповнений крок»

Перший крок, для якого обов’язкові дані відсутні; якщо всі заповнені й `completed` — крок 7.

---

## 9. API / серверні операції (орієнтир)

| Операція | Поведінка |
|----------|-----------|
| `POST /api/docs` | Створити сеанс, повернути `guid` |
| `GET/PATCH /api/docs/[guid]` | Читання / оновлення кроку |
| `POST /api/docs/[guid]/copy` | Новий сеанс з даних джерела |
| `GET/PUT /api/contacts/[inn]` | Каталог контактів |
| `GET/PUT /api/jobs/services` | Каталог послуг |
| `GET /api/docs/[guid]/pdf` | PDF |

Усі мутації одразу персистять JSON (NFR-03, NFR-10).

---

## 10. Ризики й пом’якшення

| Ризик | Пом’якшення |
|-------|-------------|
| Гонка при паралельній видачі номерів | Файловий lock / атомарний write для `doc_number.json` |
| Зміна контакту ламає старі PDF | Snapshot у сеансі |
| Розбіжність preview і PDF | Той самий HTML pipeline |
| Вим’я `invoce.html` | Не перейменовувати (BC-07); alias у коді `invoiceTemplatePath` |
| Security-through-obscurity `guid` | Прийнятно для MVP (NFR-11); UUID v4 для `guid` |

---

## 11. Порядок імплементації

1. FS store + модель сеансу + `POST/GET/PATCH` docs  
2. Wizard shell (кружки, назад/далі, persist step)  
3. Кроки 1–5 (тип, номери, контакти, послуги)  
4. Template fill + preview  
5. PDF export  
6. Copy-from-guid + resume rules  
7. Polish UI / валідація / негативні TC  

Checker: прогін TC-01…TC-24 з [requirements.md](./docs/requirements.md).
