import { recipe } from '@vanilla-extract/recipes';

export const buttonRecipe = recipe({
  base: 'btn',
  variants: {
    variant: {
      primary: 'btn--variant-primary',
      ghost: 'btn--variant-ghost',
    },
    size: {
      small: 'btn--size-small',
      medium: 'btn--size-medium',
    },
  },

});

export const shadowRecipe = recipe({
  base: 'shadow',
  variants: {
    depth: {
      1: 'shadow--depth-1',
      2: 'shadow--depth-2',
    },
  },
});

export const boxRecipe = recipe({
  base: 'box',
  variants: {
    fancy: {
      true: 'box--fancy',
    },
    size: {
      small: 'box--size-small',
    },
  },
});
