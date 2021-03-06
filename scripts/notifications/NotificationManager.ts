import INotificationManager from "./INotificationManager";
import Notification from "./Notification";
import { Observable } from "rx";
import ModelContext from "../model/ModelContext";

class NotificationManager implements INotificationManager {

    private refCounts: { [key: string]: number } = {};

    constructor(private client: SocketIOClient.Socket) { }

    notificationsFor(context: ModelContext): Observable<Notification> {
        this.subscribeToChannel(context);
        return this.getNotificationStream(context).finally(() => this.unsubscribeFromChannel(context));
    }

    protected getNotificationStream(context: ModelContext): Observable<Notification> {
        return Observable.fromEvent<Notification>(this.client, keyFor(context));
    }

    private subscribeToChannel(context: ModelContext): void {
        this.operateOnChannel("subscribe", context);
        if (!this.refCounts[keyFor(context)]) this.refCounts[keyFor(context)] = 1;
        else this.refCounts[keyFor(context)]++;
    }

    private unsubscribeFromChannel(context: ModelContext): void {
        this.refCounts[keyFor(context)]--;
        if (this.refCounts[keyFor(context)] > 0) return;

        this.operateOnChannel("unsubscribe", context);
        delete this.refCounts[keyFor(context)];
    }

    private operateOnChannel(operation: string, context: ModelContext): void {
        this.client.emit(operation, context);
    }
}

function keyFor(context: ModelContext): string {
    return `${context.area}:${context.modelId}`;
}

export default NotificationManager;
