# Discussify Global Engineering Rules
1. Stack: MongoDB, Express.js, React (with Material Design / @mui/material), Node.js.
2. Styling: Maintain a uniform color theme across all views and import `styles.css`.
3. Accessibility (WCAG AA): All views must use semantic HTML landmarks (`<main>`, `<nav>`, `<section>`), ARIA labels on icon buttons and inputs, keyboard focus management, and accessible error announcements (`role="alert"`).
4. Validation & Copy: All forms and endpoints must validate inputs and return grammatically correct, spell-checked error and success messages.
5. Immutability: A user's `email` is strictly immutable after registration. Neither the user (User Story 2) nor an Admin (User Story 6) may edit a user's email address.
