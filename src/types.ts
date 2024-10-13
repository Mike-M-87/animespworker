
export interface AnimePage {
  page: string;
  title: string;
  image_url: string;
  season: number;
  episode: number;
  summary: string;
  timestamp: string
  customDay?: number
  customTime?: string
  customSourceLink?: string
}
export interface TodaySchedule {
  title: string;
  page: string;
  image_url: string;
  time: string;
  aired: boolean;
}

// Type for the entire schedule response
export interface ScheduleResp {
  tz: string;
  schedule: TodaySchedule[] | WeekSchedule;
}

export interface TelPhotoReq {
  chat_id: string;
  photo: string;
  caption: string;
  parse_mode: string;
}

export interface TelbotResp {
  ok: boolean;
  error_code: number;
  description: string;
}

export interface WeekSchedule {
  Monday: TodaySchedule[];
  Tuesday: TodaySchedule[]
  Wednesday: TodaySchedule[]
  Thursday: TodaySchedule[]
  Friday: TodaySchedule[]
  Saturday: TodaySchedule[]
  Sunday: TodaySchedule[]
}