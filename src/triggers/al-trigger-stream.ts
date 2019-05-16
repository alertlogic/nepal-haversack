/**
 *  This is a base class for all hook executions, providing some basic information about
 *  the context in which the hook is executing and a few utility methods for interpreting
 *  sets of responses.
 */

export class AlTriggeredEvent
{

    public eventTypeName:string;
    public responses:any[] = [];

    constructor( syntheticName:string = null ) {
        this.eventTypeName = syntheticName || this.constructor.name;
    }

    /**
     * Retrieves type name
     */
    public getEventType() {
        return this.eventTypeName;
    }

    /**
     *  Allows hooks to provide feedback/responses to the triggering agent
     */
    public respond( response:any ) {
        this.responses.push( response );
    }

    /**
     *  Retrieves the first response (or returns undefined), removing it from the list of responses.
     */
    public response():any {
        return this.responses.shift();
    }

    /**
     *  Returns true if any response matches the given value, or false otherwise.
     */
    public anyResponseEquals( targetValue:any ):boolean {
        return this.responses.reduce(   ( accumulated, response ) => {
                                            return ( accumulated || response === targetValue ) ? true : false;
                                        },
                                        false );
    }

    /**
     *  Returns true if the given callback returns true for any of the responses, or false otherwise.
     */
    public anyResponseWith( checkCallback:{(responseValue:any):boolean} ):boolean {
        return this.responses.reduce(   ( accumulated, response ) => {
                                            return ( accumulated || checkCallback(response) ) ? true : false;
                                        },
                                        false );
    }
}

export declare type AlTriggeredEventCallback = {(event:AlTriggeredEvent,subscriptionId?:string):void};

export class AlTriggerStream
{
    items:{[triggerType:string]:{[subscriptionId:string]:AlTriggeredEventCallback}} = {};
    subscriptionCount:number        =   0;
    downstream:AlTriggerStream      =   null;
    flowing:boolean                 =   false;
    captured:AlTriggeredEvent[]     =   [];

    constructor( flow:boolean = true ) {
        this.flowing = flow;
    }

    public getBucket( eventTypeName:string ) {
        if ( ! this.items.hasOwnProperty( eventTypeName ) ) {
            this.items[eventTypeName] = {};
        }
        return this.items[eventTypeName];
    }

    public attach( eventType:string, callback:AlTriggeredEventCallback ):string {
        let bucket = this.getBucket( eventType );
        const listenerId:string = `sub_${++this.subscriptionCount}`;
        bucket[listenerId] = callback;
        return listenerId;
    }

    public detach( listenerId:string ) {
        for ( let typeName in this.items ) {
            if ( this.items.hasOwnProperty( typeName ) ) {
                if ( this.items[typeName].hasOwnProperty( listenerId ) ) {
                    delete this.items[typeName][listenerId];
                    return;
                }
            }
        }
    }

    public siphon( child:AlTriggerStream ) {
        child.downstream = this;
        child.tap();
    }

    public trigger( event:AlTriggeredEvent ):AlTriggeredEvent {
        let eventType = event.getEventType();
        if ( ! this.flowing ) {
            this.captured.push( event );
            return event;
        }
        const bucket = this.getBucket( eventType );
        let listenerIdList = Object.keys( bucket );
        listenerIdList.forEach( listenerId => {
            try {
                bucket[listenerId]( event, listenerId );
            } catch( e ) {
                console.warn(`Trigger callback for event ${event.constructor.name} throw exception: ${e.message}; ignoring.` );
            }
        } );

        return this.downstream ? this.downstream.trigger( event ) : event;
    }

    public tap() {
        this.flowing = true;
        while( this.captured.length > 0 ) {
            let event = this.captured.shift();
            this.trigger( event );
        }
    }
}
