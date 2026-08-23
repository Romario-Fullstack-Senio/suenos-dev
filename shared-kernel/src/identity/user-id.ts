import { v4 as uuid } from 'uuid';
import { ValueObject } from '../value-object';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(): UserId {
    return new UserId({ value: uuid() });
  }

  public static from(value: string): UserId {
    return new UserId({ value });
  }
}
