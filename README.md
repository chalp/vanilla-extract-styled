# vanilla-extract-styled

A small wrapper/utility for using `@vanilla-extract/recipes` and styled components in your project.

This package provides a convenient `styled` API on top of vanilla-extract recipes and is intended to be published as a library (supports both ESM and CommonJS). The README describes installation, usage examples, and packaging/SSR recommendations.


## Installation

We recommend using pnpm (or npm/yarn):

```bash
pnpm add @chalp/vanilla-extract-styled
# or
npm install @chalp/vanilla-extract-styled
```

### Peer dependencies

The package requires the following peer dependencies to be present in the project (they are not bundled):

- react (>=17)
- react-dom (>=17)
- @vanilla-extract/css
- @vanilla-extract/recipes

Install them in your project if they are not already present:

```bash
pnpm add react react-dom @vanilla-extract/css @vanilla-extract/recipes -w
```

## Usage

The key function: `styled(elemType, ...recipes, options?)`.

- `elemType` — a React element/component: a string tag (`'div'`, `'button'`, etc.) or a React component (functional or class).
- `...recipes` — any number of arguments, each of which can be:
  - a string — an already prepared `className` that will be appended to the resulting `className`;
  - a `RuntimeFn<VariantGroups>` function from `@vanilla-extract/recipes` (a recipe function). This function will be called at render time with an options object collected from the component's props.
- `options` — an optional trailing object, currently `{ forwardTransientProps?: boolean }` (see "Important: prop forwarding" below). Only the last argument is treated as options.

The return value is a React component. Its props are:
- all props of the original `elemType` (for example, for `'button'` — standard button attributes);
- plus automatically inferred variant props that correspond to the passed recipe functions;
- optional `className?: string`.

How `styled` calls a recipe function

The implementation takes each recipe function and calls it like this:
- it inspects `recipeFn.classNames.variants` (the keys of variant groups);
- from the component props, it picks the value for each key — first checking the direct key (e.g. `variant`), then falling back to the `$`-prefixed key (e.g. `$variant`). The direct key takes priority;
- it constructs an options object and passes it to `recipeFn(options)`;
- the result (a string of classes) is added to an array of `classes`.

The final `className` is the list of all classes (in the order recipes were passed), plus the `className` from component props (if provided), joined with spaces.

Important: prop forwarding

Props starting with `$` ("transient props") always reach the recipe functions. What happens to them after that depends on the kind of `elemType`:

- For **native DOM elements** (`'div'`, `'button'`, etc.), `$`-props are stripped before being forwarded to the DOM.
- For **components created by `styled()`**, `$`-props are passed on: the inner `styled()` consumes them for its own recipes and strips them at its leaf. This is what makes `styled(styled(...))` chains work.
- For **any other component** (third-party, hand-written, a `memo`/`forwardRef` wrapper), `$`-props are stripped by default: such a component knows nothing about them and would typically spread them onto a DOM element.

This lets you use recipe variant names that would conflict with DOM attributes without triggering React warnings:

```tsx
const Button = styled('button', buttonRecipe);

// $variant → recipe gets { variant: 'primary' }, but <button> DOM does NOT receive $variant
<Button $variant="primary">Click</Button>

// variant → recipe gets { variant: 'primary' }, AND <button> DOM receives variant
<Button variant="primary">Click</Button>
```

The same rule protects wrapped components:

```tsx
// Hand-written, third-party-like: spreads everything it does not know onto the DOM.
const Link = ({ to, className, children, ...rest }) => (
  <a href={to} className={className} {...rest}>{children}</a>
);

const Logo = styled(Link, logoRecipe);

// $big → logoRecipe gets { big: true }, Link does NOT receive $big
<Logo to="/" $big />
```

A component that consumes `$`-props itself can ask for them with the trailing options object:

```tsx
const Logo = styled(Link, logoRecipe, { forwardTransientProps: true });
```

The recognition is by identity: a `styled()` component wrapped in `memo()`, `forwardRef()` or a custom higher-order component is no longer recognized and needs the opt-in as well.

Earlier versions forwarded `$`-props to every component; now they are stopped unless the component is created by `styled()` or opts in.

Priority: if both `prop` and `$prop` are provided, the unprefixed version takes precedence for the recipe, and the `$`-prefixed version is ignored.

| Condition | `$prop` | `prop` (no prefix) |
|-----------|---------|-------------------|
| Native element (`'div'`, `'button'`) | ✅ recipe, ❌ DOM | ✅ recipe, ✅ DOM |
| Component created by `styled()` | ✅ recipe, ✅ passed on | ✅ recipe, ✅ props |
| Other component | ✅ recipe, ❌ not passed | ✅ recipe, ✅ props |
| Other component, `{ forwardTransientProps: true }` | ✅ recipe, ✅ props | ✅ recipe, ✅ props |
| Both provided simultaneously | fallback | priority |

About refs

The function returns a simple functional component without `forwardRef`. If you need ref forwarding, wrap the result in `React.forwardRef` manually.

Examples

1) Simple example: a string class

```tsx
import styled from '@chalp/vanilla-extract-styled';

const Box = styled('div', 'my-base-class');

// In render
// <Box className="local" /> => element with class="my-base-class local"
```

2) Recipe function (TypeScript)

Assume you have a recipe generated by `@vanilla-extract/recipes`:

```ts
import { recipe } from '@vanilla-extract/recipes';

export const buttonRecipe = recipe({
  base: 'btn',
  variants: {
    variant: {
      primary: 'btn--primary',
      ghost: 'btn--ghost',
    },
    size: {
      small: 'btn--sm',
      medium: 'btn--md',
    },
  },
});
```

Using `styled`:

```ts
import styled from '@chalp/vanilla-extract-styled';
import { buttonRecipe } from './button.css';

const Button = styled('button', buttonRecipe);

// In JSX
// <Button variant="primary" size="small">OK</Button>
// styled will call buttonRecipe({ variant: 'primary', size: 'small' })
// and add the resulting className to the element
```

3) Multiple recipes and string classes

```ts
const Card = styled('div', baseCardRecipe, shadowRecipe, 'ux-card');

// Order matters: classes will be in the order [baseCard, shadow, 'ux-card', props.className]
```

4) Custom React component

```tsx
const Link = ({ href, className, children, ...rest }) => (
  <a href={href} className={className} {...rest}>{children}</a>
);

const StyledLink = styled(Link, linkRecipe);

// <StyledLink href="/" active>Home</StyledLink>
// All props but the $-prefixed ones are passed to Link; those go to linkRecipe only.
// linkRecipe is called with the variant props collected from the component's props.
```

Types (short)

The returned component is typed as:

ComponentType< ComponentPropsWithoutRef<E> & VariantPropsFromMerged<T> & { className?: string } >

This means TypeScript will try to infer variant props from the provided recipe functions (`VariantPropsFromMerged<T>`).

`styled` is declared with two overloads, `styled(elemType, ...recipes)` and `styled(elemType, ...recipes, options)`, that share the result type: the options object is not part of `T`, so it does not affect inference. `StyledOptions` is exported for typing the options object outside the call.

TypeScript example (detailed)

Below is a more detailed example of types and real usage. Types are taken from `src/styled.ts` and shown here to illustrate how types are inferred in user code.

```ts
// Type imports (assumes @vanilla-extract/recipes is installed)
import type { ComponentType, ElementType, ComponentPropsWithoutRef } from 'react';
import type { RuntimeFn, RecipeVariants } from '@vanilla-extract/recipes';

// Helper utilities (as in src/styled.ts)
type Resolve<T> = { [Key in keyof T]: T[Key]; } & {};
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;
type RecipeStyleRule = any; // ComplexStyleRule | string — simplified for README
type VariantDefinitions = Record<string, RecipeStyleRule>;
type VariantGroups = Record<string, VariantDefinitions>;

type VariantSelection<Variants extends VariantGroups> = {
  [VariantGroup in keyof Variants]?: BooleanMap<keyof Variants[VariantGroup]> | undefined;
};

// RecipeOrClass — either a runtime recipe function or a className string
type RecipeOrClass = RuntimeFn<VariantGroups> | string;

// StyledOptions — the trailing options object of a styled() call
type StyledOptions = { forwardTransientProps?: boolean };

type EmptyObject = NonNullable<unknown>;

// Main type: merges variant prop types from all provided recipe functions
type VariantPropsFromMerged<T extends readonly RecipeOrClass[]> = T[number] extends infer V
  ? V extends RuntimeFn<VariantGroups>
    ? RecipeVariants<V>
    : EmptyObject
  : EmptyObject;

// Return component type
type StyledReturn<
  E extends ElementType,
  T extends readonly RecipeOrClass[],
> = ComponentType<ComponentPropsWithoutRef<E> & VariantPropsFromMerged<T> & { className?: string }>;
```

Usage example (in your code):

```tsx
import React from 'react';
import styled from '@chalp/vanilla-extract-styled';
import { recipe } from '@vanilla-extract/recipes';

// Example recipe (typical @vanilla-extract/recipes code)
export const buttonRecipe = recipe({
  base: 'btn',
  variants: {
    variant: {
      primary: 'btn--primary',
      ghost: 'btn--ghost',
    },
    size: {
      small: 'btn--sm',
      medium: 'btn--md',
    },
  },
});

// 1) styled with an HTML tag
const Button = styled('button', buttonRecipe);

// TypeScript will infer props as:
// ComponentPropsWithoutRef<'button'> & VariantPropsFromMerged<[typeof buttonRecipe]> & { className?: string }

// Usage in JSX:
// <Button variant="primary" size="small">OK</Button>

// 2) styled with a custom React component
type LinkProps = { href: string; children?: React.ReactNode };
const Link = ({ href, className, children, ...rest }: LinkProps & { className?: string }) => (
  <a href={href} className={className} {...rest}>{children}</a>
);

const linkRecipe = recipe({
  base: 'link',
  variants: {
    active: { true: 'link--active' },
  },
});

const StyledLink = styled(Link, linkRecipe);

// Prop types: LinkProps & VariantPropsFromMerged<[typeof linkRecipe]> & { className?: string }
// Usage: <StyledLink href="/" active>Home</StyledLink>
```

Notes

- The first argument to `styled` is either a string tag (`'div'`, `'button'`) or a React component.
- You can pass any number of arguments afterward: strings (pre-made class names) and/or recipe functions (`RuntimeFn<VariantGroups>`).
- A call may end with an options object: `{ forwardTransientProps: true }` makes a component not created by `styled()` receive `$`-props too. See "Important: prop forwarding" above.
- `VariantPropsFromMerged<T>` merges the variant types (`RecipeVariants`) from all provided recipe functions.
- If you pass recipe functions that share variant group names, the resulting props will be merged accordingly (the behavior is defined by `RecipeVariants` types from `@vanilla-extract/recipes`).

Helpers

The package exports color utilities grouped under the `Color` namespace, plus the `ColorSpace` enum:

```ts
import { Color, ColorSpace } from '@chalp/vanilla-extract-styled';
```

- `Color.darken(value, amount, colorSpace?)` — mixes the color with `black`. Returns a CSS `color-mix(...)` expression.
  - Example: `Color.darken('#ffcc00', 0.15)` → `"color-mix(in srgb, #ffcc00 15%, black)"`.

- `Color.lighten(value, amount, colorSpace?)` — mixes the color with `white`.
  - Example: `Color.lighten('#002244', 0.1)` → `"color-mix(in srgb, #002244 10%, white)"`.

- `Color.opacify(value, amount, colorSpace?)` — mixes the color with `transparent`.
  - Example: `Color.opacify('#000000', 0.5)` → `"color-mix(in srgb, #000000 50%, transparent)"`.

- `ColorSpace` — enum with values `'srgb'` (default) and `'oklab'`.

`amount` is a number from 0 to 1. `colorSpace` defaults to `ColorSpace.SRGB`.

Examples of using helpers in recipes:

```ts
import { recipe } from '@vanilla-extract/recipes';
import { Color, ColorSpace } from '@chalp/vanilla-extract-styled';

export const alertRecipe = recipe({
  base: 'alert',
  variants: {
    tone: {
      info: { background: Color.opacify('#0af', 0.1) },
      warn: { background: Color.darken('#ffcc00', 0.05) },
      muted: { background: Color.lighten('#002244', 0.1, ColorSpace.OKLAB) },
    },
  },
});
```

Recommendations

- Prefer the `$` prefix for recipe-only props (e.g., `$variant`, `$size`): recipes always get them, while the DOM never does. A component that is not created by `styled()` receives them only when you opt in with `{ forwardTransientProps: true }`. See "Important: prop forwarding" above.
- `styled` does not automatically forward refs — wrap the result with `React.forwardRef` if you need a ref.

Contributing and development

- Follow the project rules (ESLint, Airbnb styles).
- Run linting and build before creating a PR:

```bash
pnpm --filter @chalp/vanilla-extract-styled lint
pnpm --filter @chalp/vanilla-extract-styled build
# add tests/vitest as needed
```

License

MIT
