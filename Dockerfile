FROM rabbitmq:3.10.0-management
COPY ./rabbitmq_delayed_message_exchange-20171201-3.10.0.ez /opt/rabbitmq/plugins/
RUN rabbitmq-plugins enable rabbitmq_delayed_message_exchange