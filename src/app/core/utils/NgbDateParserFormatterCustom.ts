import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class NgbDateParserFormatterCustom extends NgbDateParserFormatter {
  readonly DELIMITER = '/';

  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.split(this.DELIMITER);
    return {
      day: +parts[0],
      month: +parts[1],
      year: +parts[2],
    };
  }

  format(date: NgbDateStruct | null): string {
    return date
      ? `${this.pad(date.day)}/${this.pad(date.month)}/${date.year}`
      : '';
  }

  private pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
