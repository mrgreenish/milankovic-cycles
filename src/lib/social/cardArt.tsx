/* eslint-disable @next/next/no-img-element -- drawn to an image by next/og, never sent to a browser */
import type { CSSProperties, ReactNode } from "react";
import type { Ui } from "@/i18n/ui";
import {
  TIME_END_KYR,
  TIME_START_KYR,
  formatYears,
  timelineSeries,
} from "@/lib/orbital/timeline";
import { SITE_URL } from "@/lib/site";
import { GLOBE_SIZE, MONO, PORTRAIT_SIZE, SERIF } from "./cardAssets";
import { CARD_SIZE, type PageCard } from "./cards";
import { OWN_SUNLIGHT_RANGE, type LabReading, type LabSetup } from "./labShare";

/**
 * The preview cards as markup for `next/og`. It lays out flexbox only, and
 * every box with more than one child must say `display: flex`.
 * Sizes are for 1200×630; most places show the card at half that or smaller,
 * so nothing that matters is set below 24px.
 */
const COLOR = {
  bg: "#070a12",
  text: "#f6f0e5",
  soft: "#c3ccda",
  muted: "#a9b4c5",
  brass: "#d8b56a",
  sun: "#f08a4b",
  ice: "#85c7f2",
  gold: "#ffd97a",
  today: "#b7c3d6",
};
const MARGIN = 72;

const label: CSSProperties = {
  display: "flex",
  fontWeight: 700,
  letterSpacing: 3.5,
  textTransform: "uppercase",
};

function Frame({
  siteName,
  width,
  picture,
  children,
}: {
  siteName: string;
  /** Room for the words, left of the picture. */
  width: number;
  picture: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        ...CARD_SIZE,
        color: COLOR.text,
        backgroundColor: COLOR.bg,
        backgroundImage:
          "radial-gradient(circle at 78% 22%, rgba(75, 103, 149, 0.26), rgba(7, 10, 18, 0) 58%)",
        fontFamily: MONO,
        fontWeight: 500,
      }}
    >
      {picture}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "absolute",
          left: MARGIN,
          top: 54,
          bottom: 50,
          width,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              marginRight: 16,
              border: `2px solid ${COLOR.brass}`,
              borderRadius: 15,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: COLOR.sun,
              }}
            />
          </div>
          <div style={{ ...label, fontSize: 25 }}>{siteName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {children}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: COLOR.muted }}>
          {new URL(SITE_URL).host}
        </div>
      </div>
    </div>
  );
}

const Eyebrow = ({ children }: { children: string }) => (
  <div style={{ ...label, marginBottom: 18, fontSize: 24, color: COLOR.brass }}>
    {children}
  </div>
);

function Title({ children, size }: { children: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: SERIF,
        fontSize: size,
        fontWeight: 600,
        lineHeight: 1.05,
        letterSpacing: size * -0.03,
        textWrap: "balance",
      }}
    >
      {children}
    </div>
  );
}

/** Short titles are set large; long ones step down so they stay within three lines. */
const titleSize = (title: string) =>
  title.length <= 18
    ? 96
    : title.length <= 30
      ? 84
      : title.length <= 40
        ? 72
        : 64;

/** The card for a page: its title beside the globe, or beside the portrait on About. */
export function PageCardArt({
  card,
  siteName,
  picture,
}: {
  card: PageCard;
  siteName: string;
  /** The globe or the portrait, as a data URL. */
  picture: string;
}) {
  const portrait = card.picture === "portrait";
  return (
    <Frame
      siteName={siteName}
      width={portrait ? 640 : 590}
      picture={
        portrait ? (
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: 0,
              top: 0,
              ...PORTRAIT_SIZE,
            }}
          >
            <img src={picture} alt="" {...PORTRAIT_SIZE} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 150,
                height: PORTRAIT_SIZE.height,
                backgroundImage: `linear-gradient(to right, ${COLOR.bg}, rgba(7, 10, 18, 0))`,
              }}
            />
          </div>
        ) : (
          <img
            src={picture}
            alt=""
            width={GLOBE_SIZE}
            height={GLOBE_SIZE}
            style={{
              position: "absolute",
              left: 664,
              top: (CARD_SIZE.height - GLOBE_SIZE) / 2,
            }}
          />
        )
      }
    >
      {card.eyebrow ? <Eyebrow>{card.eyebrow}</Eyebrow> : null}
      <Title size={titleSize(card.title)}>{card.title}</Title>
      {card.note ? (
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 27,
            lineHeight: 1.4,
            color: COLOR.soft,
          }}
        >
          {card.note}
        </div>
      ) : null}
    </Frame>
  );
}

const CHART = { width: 452, sun: 190, ice: 104, between: 58 };
const SPAN = TIME_END_KYR - TIME_START_KYR;
const xOf = (kyr: number) => ((kyr - TIME_START_KYR) / SPAN) * CHART.width;

function curve(values: (number | null)[], yOf: (value: number) => number) {
  let d = "";
  values.forEach((value, index) => {
    if (value === null) return;
    d += `${d ? "L" : "M"}${xOf(TIME_START_KYR + index).toFixed(1)} ${yOf(value).toFixed(1)}`;
  });
  return d;
}

/**
 * 800,000 years of midsummer sunlight with the setup marked on it: a date as
 * a point on the curve, a hand-set orbit as a level across it. For a date the
 * measured ice runs underneath, drawn as on the site with more ice lower down.
 */
function LabChart({ setup, ui }: { setup: LabSetup; ui: Ui }) {
  const series = timelineSeries();
  const own = setup.kind === "own";
  const low = Math.min(
    ...series.insolation,
    own ? OWN_SUNLIGHT_RANGE.min : Infinity,
  );
  const high = Math.max(
    ...series.insolation,
    own ? OWN_SUNLIGHT_RANGE.max : -Infinity,
  );
  const pad = 8;
  const sunY = (wm2: number) =>
    pad + (1 - (wm2 - low) / (high - low)) * (CHART.sun - pad * 2);
  const iceTop = CHART.sun + CHART.between;
  const iceY = (share: number) => iceTop + pad + share * (CHART.ice - pad * 2);
  const height = own ? CHART.sun : iceTop + CHART.ice;
  const today = xOf(0);
  const rowLabel: CSSProperties = {
    display: "flex",
    position: "absolute",
    left: 0,
    fontSize: 21,
    color: COLOR.muted,
  };
  let mark: ReactNode;
  if (own) {
    const y = sunY(setup.sunlightWm2);
    mark = (
      <line
        x1={0}
        x2={CHART.width}
        y1={y}
        y2={y}
        stroke={COLOR.gold}
        strokeWidth={3}
      />
    );
  } else {
    const x = xOf(setup.timeKyr);
    // The curve has one point per thousand years; the dot sits on the line between them.
    const index = Math.min(
      Math.floor(setup.timeKyr - TIME_START_KYR),
      series.insolation.length - 2,
    );
    const mix = setup.timeKyr - TIME_START_KYR - index;
    const y = sunY(
      series.insolation[index] +
        (series.insolation[index + 1] - series.insolation[index]) * mix,
    );
    mark = (
      // A group, because the renderer cannot read a fragment inside an svg.
      <g>
        <line
          x1={x}
          x2={x}
          y1={0}
          y2={height}
          stroke={COLOR.gold}
          strokeWidth={2.5}
        />
        <circle
          cx={x}
          cy={y}
          r={8}
          fill={COLOR.gold}
          stroke={COLOR.bg}
          strokeWidth={3}
        />
      </g>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        right: MARGIN,
        top: own ? 196 : 126,
        width: CHART.width,
        height: height + 44,
      }}
    >
      <div style={{ ...rowLabel, top: -36 }}>{ui.timeline.rows.sunlight}</div>
      {own ? null : (
        <div style={{ ...rowLabel, top: iceTop - 36 }}>
          {ui.timeline.rows.ice}
        </div>
      )}
      <svg
        width={CHART.width}
        height={height}
        viewBox={`0 0 ${CHART.width} ${height}`}
      >
        <rect
          x={today}
          y={0}
          width={CHART.width - today}
          height={height}
          fill="rgba(255, 255, 255, 0.05)"
        />
        <line
          x1={today}
          x2={today}
          y1={0}
          y2={height}
          stroke={COLOR.today}
          strokeWidth={1.5}
          strokeDasharray="5 5"
        />
        <path
          d={curve(series.insolation, sunY)}
          fill="none"
          stroke={COLOR.gold}
          strokeOpacity={own ? 0.5 : 1}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        {own ? null : (
          <path
            d={curve(series.ice, iceY)}
            fill="none"
            stroke={COLOR.ice}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
        )}
        {mark}
      </svg>
      <div style={{ ...rowLabel, top: height + 12 }}>
        {formatYears(TIME_START_KYR, ui)}
      </div>
      <div
        style={{
          ...rowLabel,
          left: today - 100,
          top: height + 12,
          justifyContent: "center",
          width: 200,
        }}
      >
        {ui.timeline.today}
      </div>
    </div>
  );
}

/** A date fits on one line; the longest wording for a hand-set orbit takes two smaller ones. */
const headingSize = (heading: string) =>
  heading.length <= 16 ? 66 : heading.length <= 20 ? 58 : 50;

/** The card for a shared lab link: the date or hand-set orbit, its sunlight and, for a date, its ice. */
export function LabCardArt({
  setup,
  reading,
  siteName,
  ui,
}: {
  setup: LabSetup;
  reading: LabReading;
  siteName: string;
  ui: Ui;
}) {
  return (
    <Frame
      siteName={siteName}
      width={590}
      picture={<LabChart setup={setup} ui={ui} />}
    >
      <Eyebrow>{ui.lab.title}</Eyebrow>
      <Title size={headingSize(reading.heading)}>{reading.heading}</Title>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          marginTop: 30,
          fontFamily: SERIF,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 132,
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          {reading.sunlightWm2}
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 16,
            fontSize: 50,
            color: COLOR.soft,
          }}
        >
          W/m²
        </div>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 8,
          fontSize: 26,
          color: COLOR.muted,
        }}
      >
        {ui.stage.hudLabel}
      </div>
      {reading.ice || reading.orbitOnly ? (
        <div
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: 26,
            color: reading.ice ? COLOR.ice : COLOR.muted,
          }}
        >
          {reading.ice ?? ui.timeline.orbitOnly}
        </div>
      ) : null}
    </Frame>
  );
}
