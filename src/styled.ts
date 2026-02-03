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

type VariantPropsFromMerged<T extends readonly RecipeOrClass[]> = T[number] extends infer V
  ? V extends RuntimeFn<VariantGroups>
    ? RecipeVariants<V>
    : EmptyObject
  : EmptyObject;

type StyledReturn<
  E extends ElementType,
  T extends readonly RecipeOrClass[],
> = ComponentType<ComponentPropsWithoutRef<E> & VariantPropsFromMerged<T> & { className?: string }>;

const isClassName = (v: unknown): v is string => typeof v === 'string';

const callRecipeSafely = <
  V extends VariantGroups,
  F extends RuntimeFn<V>,
  P extends Record<string, unknown>,
>(
  recipeFn: F,
  props: P,
): string => {
  const recipeOptions = Object.keys(recipeFn.classNames.variants).reduce((acc, key) => {
    if (Object.hasOwn(props, key)) {
      acc[key] = props[key];
    }

    return acc;
  }, {} as Record<string, unknown>);

  // eslint-disable-next-line no-restricted-syntax
  return recipeFn(recipeOptions as Resolve<VariantSelection<V>>);
};

export const styled = <
  E extends ElementType,
  T extends readonly RecipeOrClass[],
>(
  elemType: E,
  ...recipes: T
): StyledReturn<E, T> => (props: Record<string, unknown> = {}) => {
  const { className: classNameInner, ...rest } = props || {};

  const classes = recipes.map((r) => (
    isClassName(r) ? r : callRecipeSafely(r, rest)
  ));

  const elementProps = rest as Record<string, unknown>;

  const className = [...classes, classNameInner as string | undefined].filter((clx) => !!clx).join(' ');

  // eslint-disable-next-line no-restricted-syntax
  return createElement(elemType, {
    ...elementProps,
    className,
  });
};

export default styled;
