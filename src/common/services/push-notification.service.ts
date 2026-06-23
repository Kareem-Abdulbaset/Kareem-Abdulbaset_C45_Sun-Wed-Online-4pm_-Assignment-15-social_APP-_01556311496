import { Injectable } from "@nestjs/common";
import { JWT } from "google-auth-library";
import { env } from "../../config/env";

type NotificationData = Record<string, string>;

type NotificationInput = {
  token: string;
  title: string;
  body: string;
  data?: NotificationData;
};

@Injectable()
export class PushNotificationService {
  firebaseIsReady() {
    return Boolean(env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey);
  }

  private async getAccessToken() {
    const client = new JWT({
      email: env.firebase.clientEmail,
      key: env.firebase.privateKey,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"]
    });

    const result = await client.getAccessToken();

    if (!result.token) {
      throw new Error("Unable to create Firebase access token");
    }

    return result.token;
  }

  async sendPushNotification(input: NotificationInput) {
    if (!this.firebaseIsReady()) {
      return {
        success: false,
        reason: "Firebase config is missing"
      };
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${env.firebase.projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            token: input.token,
            notification: {
              title: input.title,
              body: input.body
            },
            data: input.data || {}
          }
        })
      }
    );

    const text = await response.text();
    let responseBody: unknown = text;

    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }

    return {
      success: response.ok,
      status: response.status,
      response: responseBody
    };
  }

  async sendPushNotificationToTokens(
    tokens: string[],
    input: Omit<NotificationInput, "token">
  ) {
    const results = [];

    for (const token of tokens) {
      const result = await this.sendPushNotification({
        token,
        title: input.title,
        body: input.body,
        data: input.data
      });

      results.push({
        token,
        ...result
      });
    }

    return results;
  }
}
