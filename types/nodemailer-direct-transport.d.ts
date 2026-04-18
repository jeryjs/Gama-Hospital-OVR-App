declare module 'nodemailer-direct-transport' {
    interface DirectTransportOptions {
        name?: string;
        debug?: boolean;
        logger?: boolean;
    }

    export default function directTransport(options?: DirectTransportOptions): any;
}
