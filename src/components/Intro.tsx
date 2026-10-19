import { forwardRef } from 'react'
import { demoSummary } from '../model/demo.ts'

export type DemoPhase = 'preparing' | 'shown' | 'none'

interface IntroProps {
  /** Null shows the introduction; otherwise the demonstration in progress. */
  demo: { phase: DemoPhase; finding: string | null } | null
  /** True once the layout checks report no overflow in the current layout. */
  resolved: boolean
  /** What layout checks currently report, phrased for people. Null while measuring. */
  liveCheck: string | null
  closing: boolean
  onTry: () => void
  onExplore: () => void
  onRestore: () => void
  onKeep: () => void
}

/**
 * A compact explanation above the preview for new visitors, and the place
 * where the demonstration explains itself. Never a full-screen
 * flow: the tool stays visible and usable underneath.
 */
export const Intro = forwardRef<HTMLHeadingElement, IntroProps>(function Intro(
  { demo, resolved, liveCheck, closing, onTry, onExplore, onRestore, onKeep },
  headingRef,
) {
  return (
    <section className="intro" aria-labelledby="intro-title" data-state={closing ? 'closing' : 'open'}>
      {demo === null ? (
        <>
          <div className="intro__text">
            <h2 id="intro-title" ref={headingRef} className="intro__title" tabIndex={-1}>
              Build and test a typography system.
            </h2>
            <p className="intro__body">
              Choose a font, adjust your text sizes, and check how they behave across desktop and mobile layouts. Export the
              result as CSS or design tokens.
            </p>
          </div>
          <div className="intro__actions">
            <button type="button" className="button button--primary" onClick={onTry}>
              See how it works
            </button>
            <button type="button" className="button button--secondary" onClick={onExplore}>
              Start exploring
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="intro__text">
            <h2 id="intro-title" ref={headingRef} className="intro__title" tabIndex={-1}>
              {demo.phase === 'preparing'
                ? 'Setting up the demonstration…'
                : demo.phase === 'shown'
                  ? resolved
                    ? 'Now everything fits.'
                    : 'This text doesn’t fit.'
                  : 'No overflow appeared this time.'}
            </h2>
            <p className="intro__body">
              {demo.phase === 'shown' && resolved ? (
                'The layout responded to your type scale. Restore your own settings, or keep exploring from here.'
              ) : demo.phase === 'shown' ? (
                <>
                  Adjust the type scale and watch the layout respond.{' '}
                  {demo.finding && <span className="intro__finding">Outlined: {demo.finding}.</span>}
                </>
              ) : demo.phase === 'none' ? (
                'Layout checks didn’t find overflow in this setup on your screen. Try a larger scale ratio or a narrower width.'
              ) : (
                'Loading the font and measuring the Dashboard.'
              )}
            </p>
            <p className="intro__meta">
              {demoSummary()} Your own settings are kept until you choose.{' '}
              {/* Always present while the demo runs, so changes are announced. */}
              <span className="intro__live" role="status">
                {liveCheck}
              </span>
            </p>
          </div>
          <div className="intro__actions">
            <button type="button" className="button button--secondary" onClick={onRestore}>
              Restore my settings
            </button>
            <button type="button" className="button button--primary" onClick={onKeep}>
              Keep exploring
            </button>
          </div>
        </>
      )}
    </section>
  )
})
