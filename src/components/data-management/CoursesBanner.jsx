import React, { useState, useEffect } from 'react';
import { Alert, Typography } from 'antd';

const { Link } = Typography;

const CoursesBanner = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const bannerClosedItem = localStorage.getItem('bannerClosed');
    if (!bannerClosedItem) {
      setVisible(true);
      return;
    }
    // If the current time is past the expiry time, remove the items from localStorage
    const bannerClosed = JSON.parse(bannerClosedItem);
    console.log('BANNER CLOSED ', bannerClosed);

    if ((bannerClosed.timestamp && new Date().getTime() > bannerClosed.timestamp)) {
      localStorage.removeItem('bannerClosed');
      setVisible(true);
    } else if (bannerClosed.value === 'true') {
      setVisible(false);
    }
  }, []);

  const handleClose = () => {
    const bannerClosed = {
      value: 'true',
      timestamp: new Date().getTime() + (7 * 24 * 60 * 60 * 1000),
    };
    localStorage.setItem('bannerClosed', JSON.stringify(bannerClosed));
    setVisible(false);
  };

  return visible ? (
    <Alert
      message={(
        <>
          Do you want to learn how to get the most out of
          {' '}
          <strong>Cellenics®</strong>
          ?
          Check out our comprehensive online course on single cell RNA-seq data analysis!
          For more details, visit
          {' '}
          <Link href='https://www.biomage.net/cellenicscourse' target='_blank'>this page</Link>
          .
          {'  '}
          <Link href='https://docs.google.com/forms/d/e/1FAIpQLSc3RkmbEUXOsCtFS030wIbtdHebDlXqY2ebUC0oPFobHTUdsg/viewform' target='_blank'> Register here today </Link>
          and boost your analysis skills!
        </>
      )}
      type='info'
      showIcon
      banner
      closable
      onClose={handleClose}
    />
  ) : null;
};

export default CoursesBanner;
