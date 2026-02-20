# Mobile-first checklist

Use this when adding or updating screens so the app stays responsive.

- **Touch targets:** Buttons and interactive elements at least `min-h-[44px]` or equivalent padding (e.g. `py-3 px-4`) on mobile.
- **Typography:** Page titles scale on small screens (e.g. `text-2xl sm:text-3xl` instead of fixed `text-3xl`).
- **Spacing:** Content uses consistent horizontal padding (e.g. `px-4 sm:px-6 lg:px-8`); avoid large fixed `max-w-*` that squeeze small screens.
- **Tables:** Wrap in `overflow-x-auto` so tables scroll horizontally on small viewports.
- **Modals/dialogs:** Use `w-full max-w-*` and padding that works on narrow viewports (e.g. `p-4 sm:p-6`).
- **Headers:** Prefer `flex flex-col gap-4 md:flex-row md:items-center md:justify-between`; buttons `w-full sm:w-auto` on mobile when appropriate.
