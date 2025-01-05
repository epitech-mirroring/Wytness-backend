import { Injectable } from '@nestjs/common';
import { CodeForm, ServiceWithCode } from '../../types/services';

@Injectable()
export class SmsService extends ServiceWithCode {
  constructor() {
    super('sms', 'receive and send sms to user', []);
  }

  async generateCode(userId: number, formData): Promise<number> {
    const phone = formData['Your phone number'];
    // verify the form and tell the user if the phone number is invalid
    const code = await this._generateCode(userId, phone);
    console.log(`Generated code ${code} for user ${userId}`);
    return code;
  }

  getForm(): CodeForm {
    return [
      {
        type: 'text',
        name: 'Your phone number',
        placeholder: '+33(0)612345678',
        description: 'Phone number',
        required: true,
      },
    ];
  }
}
