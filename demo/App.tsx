import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DenseHeartRateCanvas,
  HeartRateChart,
  SleepStagesChart,
  StrainRing,
  formatTime,
} from '../src';
import {
  DAY_START,
  WORKOUT_START,
  fullDay,
  sleepNight,
  strainScore,
  workoutSession,
} from './synthetic';

type Theme = 'light' | 'dark';

const HOUR = 3_600_000;
const ZOOM_PRESETS: { label: string; domain: [number, number] }[] = [
  { label: 'Full day', domain: [DAY_START, DAY_START + 24 * HOUR - 1000] },
  { label: 'Workout', domain: [WORKOUT_START - 10 * 60_000, WORKOUT_START + HOUR] },
  { label: 'Sensor gap', domain: [DAY_START + 13.75 * HOUR, DAY_START + 15 * HOUR] },
  { label: '5 minutes', domain: [WORKOUT_START + 10 * 60_000, WORKOUT_START + 15 * 60_000] },
];

function initialTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="card" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

export function App() {
  const [seed, setSeed] = useState(42);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [domain, setDomain] = useState<[number, number]>(ZOOM_PRESETS[0]?.domain ?? [0, 1]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const workout = useMemo(() => workoutSession(seed), [seed]);
  const night = useMemo(() => sleepNight(seed), [seed]);
  const day = useMemo(() => fullDay(seed), [seed]);
  const strain = strainScore(seed);

  return (
    <main>
      <header>
        <div>
          <h1>health-charts</h1>
          <p>Hand-written SVG and Canvas charts for React. All data on this page is synthetic.</p>
        </div>
        <div className="controls">
          <label>
            Seed{' '}
            <input
              type="number"
              value={seed}
              onChange={(event) => {
                setSeed(Number(event.target.value) || 0);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setSeed(Math.floor(Math.random() * 10_000));
            }}
          >
            Random seed
          </button>
          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
          >
            Dark theme
          </button>
        </div>
      </header>

      <div className="grid">
        <Card id="heart-rate" title="Workout heart rate">
          <HeartRateChart
            data={workout}
            maxHeartRate={190}
            maxGapMs={30_000}
            label="Workout heart rate"
          />
        </Card>
        <Card id="strain" title="Day strain">
          <div className="center">
            <StrainRing value={strain} size={180} />
          </div>
        </Card>
        <Card id="sleep" title="Last night">
          <SleepStagesChart segments={night} label="Sleep stages, last night" />
        </Card>
        <Card id="dense" title="Full day at 1 Hz (86,400 readings)">
          <div className="controls" role="group" aria-label="Zoom">
            {ZOOM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setDomain(preset.domain);
                }}
              >
                {preset.label}
              </button>
            ))}
            <output>
              {formatTime(domain[0])}–{formatTime(domain[1])}
            </output>
          </div>
          {/* Canvas colors are resolved when drawing, so a theme change remounts it. */}
          <DenseHeartRateCanvas
            key={theme}
            times={day.times}
            values={day.values}
            domain={domain}
            onDomainChange={setDomain}
          />
          <p className="hint">
            Drag to pan, scroll to zoom, double-click to reset. Keyboard: arrows, + / −, 0.
          </p>
        </Card>
      </div>
    </main>
  );
}
