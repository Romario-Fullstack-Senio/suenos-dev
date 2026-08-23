export class VideoUrl {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(url: string): VideoUrl {
    if (!url.startsWith('http')) {
      throw new Error('La URL del video debe comenzar con http');
    }
    return new VideoUrl(url);
  }
}
