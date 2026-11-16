const stitchPath = 'M20 0 C-2 20 -2 42 20 62.5 S42 105 20 125 S-2 167 20 187.5 S42 230 20 250 S-2 292 20 312.5 S42 355 20 375 S-2 417 20 437.5 S42 480 20 500 S-2 542 20 562.5 S42 605 20 625 S-2 667 20 687.5 S42 730 20 750 S-2 792 20 812.5 S42 855 20 875 S-2 917 20 937.5 S42 980 20 1000'

function StitchLine() {
  return (
    <div aria-hidden="true" className="about-stitches">
      {['left', 'right'].map((side) => (
        <div
          className={`about-stitch about-stitch-${side}`}
          key={side}
        >
          <svg className="about-stitch-curve" preserveAspectRatio="none" viewBox="0 0 40 1000">
            <path
              d={stitchPath}
              fill="none"
              stroke="currentColor"
              strokeDasharray="5 7"
              strokeLinecap="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ))}
    </div>
  )
}

export default StitchLine
