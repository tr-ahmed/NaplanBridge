# NAPLAN-Bridge Learning Platform

A modern Angular 17 application featuring a responsive home page with header and hero sections, built with standalone components and SCSS styling.

## Features

- ✨ **Modern Angular 17** with standalone components
- 🎨 **Responsive Design** with mobile-first approach
- 📱 **Mobile Navigation** with hamburger menu
- 🎯 **Hero Section** with call-to-action buttons
- 📊 **Statistics Section** with key metrics
- 🚀 **Features Preview** showcasing platform benefits
- 🔧 **Clean Architecture** with organized folder structure
- 💅 **CSS Variables** for consistent theming
- 🌐 **Routing** ready for additional pages

## Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── header/         # Navigation header
│   │   └── footer/         # Site footer
│   ├── features/           # Feature-specific components
│   │   └── home/          # Home page component
│   ├── shared/            # Shared utilities and services
│   ├── core/              # Core services and guards
│   └── models/            # TypeScript interfaces and types
├── styles.scss            # Global styles and CSS variables
└── index.html            # Main HTML template
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
