// Only the times supplied by the organizers are shown; other items appear in order without a time.
export type ScheduleItem = {time: string | null; title: string};
export type ScheduleDay = {
  dayLabel: string;
  dateLabel: string;
  kind: 'opening' | 'hack' | 'wrapup';
  title: string;
  items: ScheduleItem[];
};

const hackDay = (dayLabel: string, dateLabel: string): ScheduleDay => ({
  dayLabel,
  dateLabel,
  kind: 'hack',
  title: 'Hackathon day',
  items: [
    {time: '07:00–09:00', title: 'Breakfast'},
    {time: null, title: 'Hacking'},
    {time: '12:00', title: 'Lunch'},
    {time: null, title: 'Hacking'},
    {time: null, title: 'Dinner'},
  ],
});

export const schedule: ScheduleDay[] = [
  {
    dayLabel: '1',
    dateLabel: 'Sun 7 Feb',
    kind: 'opening',
    title: 'Opening workshop',
    items: [
      {time: '12:30', title: 'Registration opens'},
      {time: '13:00', title: 'Opening'},
      {time: null, title: 'Self-introduction of participants'},
      {time: null, title: 'TRE tutorial'},
      {time: null, title: 'Topic proposals & team grouping'},
      {time: null, title: 'Dinner'},
    ],
  },
  hackDay('2', 'Mon 8 Feb'),
  hackDay('3', 'Tue 9 Feb'),
  hackDay('4', 'Wed 10 Feb'),
  hackDay('5', 'Thu 11 Feb'),
  {
    dayLabel: '6',
    dateLabel: 'Fri 12 Feb',
    kind: 'wrapup',
    title: 'Wrap-up',
    items: [
      {time: '07:00–09:00', title: 'Breakfast'},
      {time: null, title: 'Wrap-up session'},
      {time: null, title: 'Depart from venue to CNX airport'},
    ],
  },
];

export const hackDaysSummary = {dayLabel: '2–5', dateLabel: 'Mon 8 – Thu 11 Feb'};
