import type { ComponentProps } from 'react';

import {
  describe,
  it,
  expect,
  expectTypeOf,
  vi,
  afterEach,
} from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import {
  styled,
} from './styled';
import {
  boxRecipe,
  shadowRecipe,
  buttonRecipe,
} from './styled.css';

// Calls a component created by `styled()` as a plain function to inspect the props it passes down.
type Callable = (props: Record<string, unknown>) => {
  props: Record<string, unknown>;
  type: unknown;
};

const call = (component: unknown, props: Record<string, unknown>) => (
  component as Callable
)(props);

// A hand-written component that spreads unknown props onto a DOM element, as third-party ones do.
const Link = ({ children, ...rest }: { children?: unknown } & Record<string, unknown>) => (
  createElement('a', rest, children)
);

// `styled()` around a component that knows nothing about `$`-props.
const StyledLink = styled(Link, buttonRecipe);
// The same with an explicit opt-in to pass `$`-props through.
const OptInStyledLink = styled(Link, buttonRecipe, { forwardTransientProps: true });

describe('styled', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('strips $-prefixed props for components not created by styled()', () => {
    const el = call(StyledLink, { $variant: 'primary', href: '/' });

    // the recipe still gets the variant…
    expect(String(el.props.className)).toContain('btn--variant-primary');
    // …but the component does not: it would spread it onto the DOM element
    expect(Object.hasOwn(el.props, '$variant')).toBe(false);
    expect(el.props.href).toBe('/');
  });

  it('keeps $-props inside a styled() chain: the plain component at the end gets none', () => {
    const EnhancedLink = styled(StyledLink, shadowRecipe);

    const enhancedEl = call(EnhancedLink, { $variant: 'primary', $depth: '2', href: '/' });
    // the inner styled() still receives variants for its own recipe
    expect(Object.hasOwn(enhancedEl.props, '$variant')).toBe(true);

    const baseEl = call(enhancedEl.type, enhancedEl.props);
    expect(String(baseEl.props.className)).toContain('btn--variant-primary');
    // …but the plain component at the end of the chain does not
    expect(Object.hasOwn(baseEl.props, '$variant')).toBe(false);
    expect(Object.hasOwn(baseEl.props, '$depth')).toBe(false);
  });

  it('forwards $-prefixed props to a plain component on explicit opt-in', () => {
    const el = call(OptInStyledLink, { $variant: 'primary', href: '/' });

    expect(String(el.props.className)).toContain('btn--variant-primary');
    expect(Object.hasOwn(el.props, '$variant')).toBe(true);
    expect(el.props.href).toBe('/');
  });

  it('infers $-props with and without the options object', () => {
    expectTypeOf<ComponentProps<typeof StyledLink>>().toHaveProperty('$variant');
    expectTypeOf<ComponentProps<typeof OptInStyledLink>>().toHaveProperty('$variant');
  });

  it('renders without a React warning about $-props on a DOM element', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderToString(createElement(StyledLink, { $variant: 'primary', href: '/' }));
    expect(errorSpy).not.toHaveBeenCalled();

    // control for the assertion above: the opt-in is what makes React complain
    renderToString(createElement(OptInStyledLink, { $variant: 'primary', href: '/' }));
    expect(errorSpy).toHaveBeenCalledTimes(1);
    // the wording differs between renderers and React versions, the prop name is always reported
    expect(String(errorSpy.mock.calls[0])).toContain('$variant');
  });
});
