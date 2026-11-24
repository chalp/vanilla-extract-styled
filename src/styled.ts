import type { ComponentType, ElementType, ComponentPropsWithoutRef } from 'react';
import type { ComplexStyleRule } from '@vanilla-extract/css';
import type { RuntimeFn, RecipeVariants } from '@vanilla-extract/recipes';

import { createElement } from 'react';

type Resolve<T> = {
  [Key in keyof T]: T[Key];
} & {};
type BooleanMap<T> = T extends 'true' | 'false' ? boolean : T;
type RecipeStyleRule = ComplexStyleRule | string;
type VariantDefinitions = Record<string, RecipeStyleRule>;
type VariantGroups = Record<string, VariantDefinitions>;

type VariantSelection<Variants extends VariantGroups> = {
  [VariantGroup in keyof Variants]?: BooleanMap<keyof Variants[VariantGroup]> | undefined;
};

type RecipeOrClass = RuntimeFn<VariantGroups> | string;

type EmptyObject = NonNullable<unknown>;

export interface StyledOptions {
  /** Pass `$`-prefixed props to a component not created by `styled()` as-is (stripped by default). */
  forwardTransientProps?: boolean;
}

type WithTransient<T> = T & {
  [K in keyof T as K extends `$${string}` ? never : `$${string & K}`]?: T[K];
};

type VariantPropsFromMerged<T extends readonly RecipeOrClass[]> = T[number] extends infer V
  ? V extends RuntimeFn<VariantGroups>
    ? WithTransient<RecipeVariants<V>>
    : EmptyObject
  : EmptyObject;

type StyledReturn<
  E extends ElementType,
  T extends readonly RecipeOrClass[],
> = ComponentType<ComponentPropsWithoutRef<E> & VariantPropsFromMerged<T> & { className?: string }>;

const TRANSIENT_PROP_PREFIX = '$';

// Components created by `styled()`: the only ones known to consume `$`-props themselves.
const styledComponents = new WeakSet<object>();

const isClassName = (v: unknown): v is string => typeof v === 'string';
const isOptions = (v: unknown): v is StyledOptions => typeof v === 'object' && v !== null;
const isObjectLike = (v: unknown): v is object => (
  (typeof v === 'object' || typeof v === 'function') && v !== null
);

const callRecipeSafely = <
  V extends VariantGroups,
  F extends RuntimeFn<V>,
  P extends Record<string, unknown>,
>(
  recipeFn: F,
  props: P,
): string => {
  const recipeOptions = Object.keys(recipeFn.classNames.variants).reduce((acc, key) => {
    const value = props[key] ?? props[`${TRANSIENT_PROP_PREFIX}${key}`];

    if (value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, unknown>);

  // eslint-disable-next-line no-restricted-syntax
  return recipeFn(recipeOptions as Resolve<VariantSelection<V>>);
};

const splitArgs = (
  args: readonly unknown[],
): { recipes: readonly RecipeOrClass[]; options?: StyledOptions } => {
  const lastArg = args[args.length - 1];

  if (!isOptions(lastArg)) {
    return { recipes: args as readonly RecipeOrClass[] };
  }

  return { recipes: args.slice(0, -1) as readonly RecipeOrClass[], options: lastArg };
};

const omitTransientProps = (props: Record<string, unknown>): Record<string, unknown> => (
  Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith(TRANSIENT_PROP_PREFIX)),
  )
);

export function styled<E extends ElementType, T extends readonly RecipeOrClass[]>(
  elemType: E,
  ...recipes: T
): StyledReturn<E, T>;
export function styled<E extends ElementType, T extends readonly RecipeOrClass[]>(
  elemType: E,
  ...args: readonly [...recipes: T, options: StyledOptions]
): StyledReturn<E, T>;
export function styled(
  elemType: ElementType,
  ...args: readonly unknown[]
): ComponentType<Record<string, unknown>> {
  const { recipes, options } = splitArgs(args);

  // A `$`-prop must never reach the DOM. A host element never gets one; a component gets them only
  // when it is known to consume them: another `styled()` (it strips them at its own leaf) or an
  // explicit opt-in. Any other component would typically spread them onto a DOM element.
  const passesTransientProps = options?.forwardTransientProps === true
    || (isObjectLike(elemType) && styledComponents.has(elemType));

  const component = (props: Record<string, unknown> = {}) => {
    const { className: classNameInner, ...rest } = props;

    const classes = recipes.map((r) => (
      isClassName(r) ? r : callRecipeSafely(r, rest)
    ));

    const elementProps = (
      passesTransientProps ? rest : omitTransientProps(rest)
    ) as Record<string, unknown>;

    const className = [...classes, classNameInner as string | undefined].filter((clx) => !!clx).join(' ');

    // eslint-disable-next-line no-restricted-syntax
    return createElement(elemType, {
      ...elementProps,
      className,
    });
  };

  styledComponents.add(component);

  return component;
}

export default styled;
