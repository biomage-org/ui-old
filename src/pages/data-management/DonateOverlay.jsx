import React, { useState } from 'react';
import { Modal, Typography, Button } from 'antd';

const { Title, Paragraph } = Typography;

const DonateOverlay = () => {
  const [closed, setClosed] = useState(false);

  return (
    <Modal
      visible={!closed}
      footer={null}
      centered
      closable
      onCancel={() => setClosed(true)}
    >
      <div style={{ textAlign: 'center' }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          Support our mission
        </Title>
        <Paragraph style={{ marginBottom: 24, textAlign: 'left' }}>
          <p><b>Dear academic community,</b></p>
          <p>
            We believe that knowledge should be freely accessible to all, which is why we provide our services to academics free of charge.
          </p>
          <p>
            However, maintaining and improving our services requires ongoing resources and funding.
          </p>
          <p>
            If you find our services valuable, we kindly ask for your support in the form of a donation.
            Every contribution, big or small, will help us cover our monthly costs so that we can continue to provide free access to our services and expand our offerings to better serve the academic community.
          </p>
          <a href='https://www.biomage.net/donations-campaign' target='_blank' rel='noreferrer'>More information</a>
        </Paragraph>
        <a href='https://www.paypal.com/donate/?hosted_button_id=KJ8K3G8RXNGZA' target='_blank' rel='noopener noreferrer'>
          <Button type='primary'>Donate</Button>
        </a>
      </div>
    </Modal>
  );
};

export default DonateOverlay;
