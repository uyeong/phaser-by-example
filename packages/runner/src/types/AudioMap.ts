type AudioKey = 'theme' | 'jump' | 'coin' | 'dead' | 'growling';
type AudioMap = Map<AudioKey, Phaser.Sound.BaseSound>;

export default AudioMap;
export type { AudioKey };
