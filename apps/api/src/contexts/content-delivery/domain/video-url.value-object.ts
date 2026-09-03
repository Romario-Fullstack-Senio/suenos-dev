import { DomainError } from '@suenos-dev/shared-kernel';

export class VideoUrl {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(url: string): VideoUrl {
    if (!url.startsWith('http')) {
      throw new DomainError('La URL del video debe comenzar con http');
    }
    return new VideoUrl(url);
  }
}
