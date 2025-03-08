import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(envs.STRIPE_SECRET);
  }

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { items, currency, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
    });

    return session;
  }

  async handleStripeWebhook(request: Request, response: Response) {
    const signature = request.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    const endpointLocalSecret = envs.STRIPE_ENDPOINT_SECRET;

    try {
      event = this.stripe.webhooks.constructEvent(
        request['rawBody'],
        signature,
        endpointLocalSecret,
      );
    } catch (error) {
      return response.status(400).send(`Webhook Error: ${error}`);
    }

    const eventType = event?.type;

    const eventTypeHandlersMap: Record<string, (event: Stripe.Event) => void> =
      {
        'charge.succeeded': () => this.handleChargeSucceeded(event),
      };

    if (eventType && eventType in eventTypeHandlersMap) {
      eventTypeHandlersMap[eventType](event);
    }

    return Promise.resolve(
      response.status(200).json({
        signature,
      }),
    );
  }

  private handleChargeSucceeded(event: Stripe.Event) {
    const chargeSucceeded = event.data.object as Stripe.Charge;
    console.log({ metadata: chargeSucceeded.metadata });
  }
}
