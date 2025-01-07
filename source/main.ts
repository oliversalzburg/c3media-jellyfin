import { redirectErrorsToConsole } from "@oliversalzburg/js-utils/errors/console.js";
import { InternalError } from "@oliversalzburg/js-utils/errors/InternalError.js";
import {
  Conferences,
  ConferenceWithEvents,
  Event,
  EventWithRecordings,
  Recording,
} from "./types.js";

const API_BASE = "https://api.media.ccc.de/public";
const MIRROR_CONGRESS = 31;
const MIRROR_ACRONYM = `${MIRROR_CONGRESS}c3`;
const MIRROR_MIMETYPE = "video/mp4";
const MIRROR_OUTPUT = `Chaos Communication Congress (1984)/Season ${MIRROR_CONGRESS.toString().padStart(2, "0")}`;

const getConferences = async (): Promise<Conferences> => {
  const response = await fetch(`${API_BASE}/conferences`);
  if (response.status !== 200) {
    throw new InternalError("non-200 response");
  }

  const conferences = await response.json();
  return conferences as Conferences;
};

const getConference = async (acronym: string): Promise<ConferenceWithEvents> => {
  const response = await fetch(`${API_BASE}/conferences/${acronym}`);
  if (response.status !== 200) {
    throw new InternalError("non-200 response");
  }

  const conference = await response.json();
  return conference as ConferenceWithEvents;
};

const getEvent = async (guid: string): Promise<EventWithRecordings> => {
  const response = await fetch(`${API_BASE}/events/${guid}`);
  if (response.status !== 200) {
    throw new InternalError("non-200 response");
  }

  const event = await response.json();
  return event as EventWithRecordings;
};

const getFileExtension = (filename: string): string => {
  const separatorIndex = filename.lastIndexOf(".");
  if (separatorIndex < 0) {
    return "";
  }

  return filename.substring(separatorIndex + 1, filename.length);
};

const makeEpisodeIndex = (index: number, episodePad = 3): string => {
  return `S${MIRROR_CONGRESS.toString().padStart(2, "0")}E${index.toString().padStart(episodePad, "0")}`;
};

const makeFilenameRecording = (
  event: Event,
  recording: Recording,
  index: number,
  episodePad = 3,
): string => {
  return `${MIRROR_OUTPUT}/${makeEpisodeIndex(index, episodePad)} - ${event.title.replaceAll(/[^-_a-z0-9 (),äöüÄÖÜ?!.]/gi, "").replaceAll(/ +/g, " ")}.${getFileExtension(recording.recording_url)}`;
};

const makeFilenameThumb = (event: Event, index: number, episodePad = 3): string => {
  return `${MIRROR_OUTPUT}/${makeEpisodeIndex(index, episodePad)} - ${event.title.replaceAll(/[^-_a-z0-9 (),äöüÄÖÜ?!.]/gi, "").replaceAll(/ +/g, " ")}-thumb.${getFileExtension(event.poster_url)}`;
};

const download = (source: string, target: string) => {
  return `curl --location "${encodeURI(source)}" --create-dirs --silent --show-error --continue-at - --output "${target}"`;
};

const titleSanitize = (title: string): string => {
  return title.replaceAll(/\r?\n/g, "").replaceAll(/"/g, '\\"').replaceAll(/\$/g, "\\$");
};

const main = async () => {
  const conference = await getConference(MIRROR_ACRONYM);
  const events = conference.events.toSorted((a, b) =>
    a.date === b.date
      ? a.title.toLocaleLowerCase().localeCompare(b.title.toLocaleLowerCase())
      : new Date(a.date).valueOf() - new Date(b.date).valueOf(),
  );
  process.stderr.write(`${events.length} events retrieved.\n`);

  const padLength = events.length.toString().length;

  process.stdout.write("#!/usr/bin/env bash\n");
  process.stdout.write(
    `echo "${titleSanitize(conference.title)}" && ${download(
      conference.logo_url,
      `${MIRROR_OUTPUT}/cover.${getFileExtension(conference.logo_url)}`,
    )}\n`,
  );

  let episodeIndex = 1;
  for (const event of events) {
    const eventExpanded = await getEvent(event.guid);
    const recordings =
      eventExpanded.recordings.length === 1
        ? eventExpanded.recordings
        : eventExpanded.recordings.filter(
            recording =>
              recording.language === eventExpanded.original_language &&
              recording.mime_type.startsWith("video/") &&
              recording.high_quality,
          );

    if (recordings.length === 0) {
      process.stderr.write(
        `Could not determine recording for event: ${event.title}. Dumping API response...\n`,
      );
      process.stderr.write(JSON.stringify(eventExpanded, undefined, 2));
      process.exit(1);
    }

    const recording = (
      recordings.some(recording => recording.mime_type === MIRROR_MIMETYPE)
        ? recordings.filter(recording => recording.mime_type === MIRROR_MIMETYPE)
        : recordings.sort((a, b) => a.height - b.height)
    )[0];

    const filename = makeFilenameRecording(event, recording, episodeIndex, padLength);
    const filenameThumb = makeFilenameThumb(event, episodeIndex, padLength);
    process.stdout.write(
      `echo "${episodeIndex.toString().padStart(padLength, " ")}/${events.length.toString()} ${titleSanitize(event.title)}" && ${download(recording.recording_url, filename)} && ${download(event.poster_url, filenameThumb)}\n`,
    );

    ++episodeIndex;
  }

  process.stdout.write(`echo "${titleSanitize(conference.title)} synchronized."`);
  process.stderr.write("Done.\n");
};

main().catch(redirectErrorsToConsole(console));
