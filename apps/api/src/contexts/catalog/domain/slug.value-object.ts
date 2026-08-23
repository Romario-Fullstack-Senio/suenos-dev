import { ValueObject } from '@suenos-dev/shared-kernel';

interface SlugProps {
  value: string;
}

export class Slug extends ValueObject<SlugProps> {
  private constructor(props: SlugProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static from(text: string): Slug {
    const slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return new Slug({ value: slug });
  }
}
