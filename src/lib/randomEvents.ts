// Simple random event generator for conversational realism
// Returns a short atmospheric or situational event string.
export const getRandomEvent = (): string => {
  const events = [
    'A sudden thunderstorm rattles the windows, the rain drumming a steady rhythm.',
    'The wind howls outside, shaking the curtains and sending a chill through the room.',
    'A distant train whistle echoes across the valley, a reminder of the world beyond.',
    'A stray cat slips in through the open window, pausing to watch the scene.',
    'The lights flicker briefly, casting fleeting shadows on the walls.',
    'A soft piano melody drifts from a nearby room, adding a gentle soundtrack.',
    'The scent of fresh coffee wafts in, briefly breaking the tension.',
    'An unexpected text notification buzzes, displaying a cryptic message.',
    'A gust of cold air slides under the door, making the blankets rustle.',
    'The fireplace sparks briefly, throwing warm amber light across the faces.'
  ];
  const idx = Math.floor(Math.random() * events.length);
  return events[idx];
};
