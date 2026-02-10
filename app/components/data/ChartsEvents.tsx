"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import dayjs from "dayjs";

type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  end_date: string | null;
  location: string | null;
};

type Props = {
  events: Event[];
};

export default function EventTimeline({ events }: Props) {
  const timelineData = events
    .filter((event) => event.date) // nur Events mit Startdatum
    .map((event) => {
      const start = dayjs(event.date!).valueOf(); // Timestamp
      const end = event.end_date ? dayjs(event.end_date).valueOf() : start;

    return {
      name: event.title,
      value: [event.title, start, end],
      tooltip: {
        formatter: `${event.title}<br/>${dayjs(event.date).format("DD.MM.YYYY")}${
        event.end_date ? " bis " + dayjs(event.end_date).format("DD.MM.YYYY") : ""
        }`,
      },
    };
    });

  const chartOptions: echarts.EChartsOption = {
    title: {
      text: "Zeitstrahl der Ereignisse",
      left: "center",
    },
    tooltip: {
      formatter: (params: any) => params.data.tooltip.formatter,
    },
    grid: {
      left: 150,
      right: 40,
      top: 80,
      bottom: 40,
    },
    xAxis: {
      type: "time",
      axisLabel: {
        rotate: 45,
      },
      splitLine: {
        show: true
      }
    },
    yAxis: {
      type: "category",
      data: timelineData.map((d) => d.name),
      splitLine: {
        show: false
      }
    },
    series: [
      {
        type: "custom",
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0);
          const start = api.coord([api.value(1), categoryIndex]);
          const end = api.coord([api.value(2), categoryIndex]);
          const height = 25;

          const isPoint = api.value(1) === api.value(2);
          if (isPoint) {
            // Einzelpunkt
            return {
              type: "circle",
              shape: {
                cx: start[0],
                cy: start[1],
                r: 6,
              },
              style: {
                fill: "#5470c6",
              },
            };
          } else {
            // Zeitraum (Balken)
            return {
              type: "rect",
              shape: {
                x: start[0],
                y: start[1] - height / 2,
                width: end[0] - start[0],
                height: height,
              },
              style: {
                fill: "#91cc75",
              },
            };
          }
        },
        label: {
          show: false,
        },
        encode: {
          x: [1, 2],
          y: 0,
        },
        data: timelineData,
      },
    ],
  };

  return <ReactECharts option={chartOptions} style={{ height: 500 }} />;
}
