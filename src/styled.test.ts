import {
  describe,
  it,
  expect,
} from 'vitest';

import {
  styled,
} from './styled';
import {
  boxRecipe,
  shadowRecipe,
  buttonRecipe,
} from './styled.css';

describe('styled', () => {
  it('creates elements with composed className from recipes and string classes', () => {
    const Button = styled('button', buttonRecipe, shadowRecipe, 'ux-card');

    const el = (Button as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      variant: 'primary',
      size: 'small',
      depth: '2',
      className: 'local',
      title: 'ok',
    });

    // class order: [buttonRecipe, shadowRecipe, 'ux-card', props.className]
    const cn = String(el.props.className);
    // vanilla-extract will add generated/scoped class names (hashes), so assert presence of
    // semantic tokens rather than exact equality
    expect(cn).toContain('btn');
    expect(cn).toContain('btn--variant-primary');
    expect(cn).toContain('btn--size-small');
    expect(cn).toContain('shadow');
    expect(cn).toContain('shadow--depth-2');
    expect(cn).toContain('ux-card');
    expect(cn).toContain('local');
    // other props should be forwarded
    expect(el.props.title).toBe('ok');
  });

  it('ignores undefined/false variant props when calling recipe', () => {
    const Box = styled('div', boxRecipe);

    const el = (Box as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      size: undefined,
      fancy: false,
      className: 'c',
    });

    // only base + provided className (vanilla-extract adds generated scope classnames)
    const boxCn = String(el.props.className);
    expect(boxCn).toContain('box');
    expect(boxCn).toContain('c');
  });

  it('strips $-prefixed props for host elements (string elemType)', () => {
    const Button = styled('button', buttonRecipe);

    const el = (Button as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      $variant: 'primary',
      $size: 'small',
      title: 'ok',
    });

    const cn = String(el.props.className);
    expect(cn).toContain('btn--variant-primary');
    expect(cn).toContain('btn--size-small');
    // $-prefixed props should NOT appear in element props
    expect(Object.hasOwn(el.props, '$variant')).toBe(false);
    expect(Object.hasOwn(el.props, '$size')).toBe(false);
    // regular props should still be forwarded
    expect(el.props.title).toBe('ok');
  });

  it('passes $-prefixed props through for composite components (non-string elemType)', () => {
    const BaseButton = styled('button', buttonRecipe);
    const EnhancedButton = styled(BaseButton, shadowRecipe);

    const el = (EnhancedButton as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      $depth: '2',
      variant: 'primary',
    });

    const cn = String(el.props.className);
    expect(cn).toContain('shadow--depth-2');
    // $-prefixed props should be forwarded to the composite component
    expect(Object.hasOwn(el.props, '$depth')).toBe(true);
    // regular props forwarded as usual
    expect(Object.hasOwn(el.props, 'variant')).toBe(true);
  });

  it('prefers direct prop over $-prefixed when both exist for recipe', () => {
    const Button = styled('button', buttonRecipe);

    const el = (Button as unknown as (props?: Record<string, unknown>) => { props: Record<string, unknown> })({
      variant: 'ghost',
      $variant: 'primary',
    });

    const cn = String(el.props.className);
    // direct 'variant' takes priority over '$variant'
    expect(cn).toContain('btn--variant-ghost');
    expect(cn).not.toContain('btn--variant-primary');
  });
});
