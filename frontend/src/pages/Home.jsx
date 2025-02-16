import { Layout, Button, Typography, Row, Col, Card, Space, Collapse, Carousel, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, BarChartOutlined, TeamOutlined, GlobalOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect } from 'react';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Animated QR code component
const AnimatedQR = animated(() => (
  <QrcodeOutlined style={{ fontSize: '200px', color: '#1890ff', margin: '40px 0' }} />
));

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const qrAnimation = useSpring({
    from: { transform: 'scale(0)' },
    to: { transform: 'scale(1)' },
    config: { tension: 200, friction: 20 }
  });

  // Simulate live scan counter
  useEffect(() => {
    const interval = setInterval(() => {
      setScanCount((prev) => prev + Math.floor(Math.random() * 10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate loading delay
  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', textAlign: 'center' }}>
      <Header style={{ background: '#001529', padding: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>EduScan Pro</Title>
          </Col>
          <Col>
            <Button ghost onClick={() => navigate('/auth/login')}>Get Started</Button>
          </Col>
        </Row>
      </Header>
      
      <Content style={{ padding: '0 50px' }}>
        {/* Hero Section */}
        <section style={{ padding: '100px 0', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <Title level={1} style={{ marginBottom: '20px' }}>
            Revolutionize Student Attendance Tracking
          </Title>
          <Text style={{ fontSize: '18px', color: '#555', display: 'block', marginBottom: '40px' }}>
            Instant scans. Real-time analytics. Zero paperwork.
          </Text>
          <AnimatedQR style={qrAnimation} />
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/auth/login')}
              style={{ padding: '0 40px', height: '50px' }}
            >
              Start Free Trial
            </Button>
            <Button 
              size="large"
              onClick={() => document.getElementById('features').scrollIntoView()}
              style={{ padding: '0 40px', height: '50px' }}
            >
              Learn More
            </Button>
          </Space>
          <div style={{ marginTop: '40px' }}>
            <Text strong style={{ fontSize: '16px' }}>
              <GlobalOutlined /> Trusted by educators in 15+ countries
            </Text>
          </div>
        </section>

        {/* Live Counter */}
        <section style={{ padding: '40px 0', background: '#fff' }}>
          <Title level={4}>
            <ClockCircleOutlined /> Live Attendance Scans: {scanCount.toLocaleString()}
          </Title>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '60px' }}>Why Choose EduScan Pro?</Title>
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable>
                <ClockCircleOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
                <Title level={4} style={{ margin: '20px 0' }}>Real-time Tracking</Title>
                <Text>Instant attendance updates with live classroom monitoring</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable>
                <SafetyOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
                <Title level={4} style={{ margin: '20px 0' }}>Secure System</Title>
                <Text>Military-grade encryption and dynamic QR codes</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable>
                <BarChartOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
                <Title level={4} style={{ margin: '20px 0' }}>Smart Analytics</Title>
                <Text>Automated reports and attendance pattern recognition</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Video Demonstration */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>See It in Action</Title>
          <Row justify="center">
            <Col xs={24} md={16}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden'
              }}>
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '10px'
                  }}
                  src="https://www.youtube.com/embed/your-video-id"
                  title="EduScan Pro Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </Col>
          </Row>
        </section>

        {/* Client Logos */}
        <section style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>Trusted By</Title>
          <Row gutter={[40, 40]} justify="center" align="middle">
            <Col>
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" style={{ height: '50px' }} />
            </Col>
            <Col>
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/Microsoft_logo.png" alt="Microsoft" style={{ height: '50px' }} />
            </Col>
            <Col>
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Canvas_logo.png" alt="Canvas" style={{ height: '50px' }} />
            </Col>
          </Row>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>What Our Users Say</Title>
          <Carousel autoplay>
            <div>
              <Card>
                <Text>&quot;EduScan Pro has transformed how we track attendance. It&apos;s fast, reliable, and easy to use!&quot;</Text>
                <Text strong>- John Doe, University of XYZ</Text>
              </Card>
            </div>
            <div>
              <Card>
                <Text>&quot;The analytics feature is a game-changer for our institution.&quot;</Text>
                <Text strong>- Jane Smith, ABC College</Text>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* Team Collaboration Section */}
        <section style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>Collaborate Seamlessly</Title>
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} md={12}>
              <TeamOutlined style={{ fontSize: '100px', color: '#1890ff' }} />
              <Title level={4} style={{ margin: '20px 0' }}>Team-Friendly</Title>
              <Text>EduScan Pro makes it easy for instructors and administrators to collaborate on attendance data in real-time.</Text>
            </Col>
            <Col xs={24} md={12}>
              <PlayCircleOutlined style={{ fontSize: '100px', color: '#1890ff' }} />
              <Title level={4} style={{ margin: '20px 0' }}>Interactive Training</Title>
              <Text>We provide video tutorials and live support to ensure your team is up and running quickly.</Text>
            </Col>
          </Row>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>Frequently Asked Questions</Title>
          <Collapse accordion>
            <Panel header="How does EduScan Pro work?" key="1">
              <Text>EduScan Pro uses dynamic QR codes that instructors generate for each session. Students scan the code using their smartphone cameras, and attendance is recorded instantly.</Text>
            </Panel>
            <Panel header="Is it secure?" key="2">
              <Text>Yes, we use military-grade encryption and dynamic QR codes that expire after a set time to prevent misuse.</Text>
            </Panel>
            <Panel header="Can I export attendance data?" key="3">
              <Text>Absolutely! You can export attendance reports in Excel or CSV format with just one click.</Text>
            </Panel>
          </Collapse>
        </section>

        {/* Integration Partners */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>Integration Partners</Title>
          <Row gutter={[40, 40]} justify="center" align="middle">
            <Col>
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google Classroom" style={{ height: '50px' }} />
            </Col>
            <Col>
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/Microsoft_logo.png" alt="Moodle" style={{ height: '50px' }} />
            </Col>
            <Col>
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Canvas_logo.png" alt="Canvas" style={{ height: '50px' }} />
            </Col>
          </Row>
        </section>

        {/* Interactive Roadmap */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px' }}>Our Roadmap</Title>
          <Row gutter={[40, 40]}>
            <Col xs={24} md={8}>
              <Card>
                <Title level={4}>Q4 2023</Title>
                <Text>AI-powered attendance predictions</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Title level={4}>Q1 2024</Title>
                <Text>Integration with Zoom and Microsoft Teams</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Title level={4}>Q2 2024</Title>
                <Text>Multi-language support expansion</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '30px' }}>Ready to Transform Attendance?</Title>
          <Text style={{ fontSize: '18px', marginBottom: '40px', display: 'block' }}>
            Join 500+ educational institutions using EduScan Pro
          </Text>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/auth/login')}
            style={{ padding: '0 50px', height: '60px', fontSize: '18px' }}
          >
            Get Started Now
          </Button>
        </section>
      </Content>

      {/* Footer */}
      <Footer style={{ background: '#001529', color: '#fff', padding: '40px 0', textAlign: 'center' }}>
        <Row gutter={[40, 40]} justify="center">
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff' }}>EduScan Pro</Title>
            <Text level={4} style={{ color: '#fff' }}>Revolutionizing attendance tracking for modern education.</Text>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff' }}>Quick Links</Title>
            <Space direction="vertical">
              <a href="#features" style={{ color: '#fff' }}>Features</a>
              <a href="#testimonials" style={{ color: '#fff' }}>Testimonials</a>
              <a href="#faq" style={{ color: '#fff' }}>FAQ</a>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff' }}>Contact Us</Title>
            <Text level={4} style={{ color: '#fff' }} >Email: support@eduscanpro.com</Text>
            <br />
            <Text level={4} style={{ color: '#fff' }}>Phone: +1 (123) 456-7890</Text>
          </Col>
        </Row>
        <Row justify="center" style={{ marginTop: '40px' }}>
          <Text level={4} style={{ color: '#fff' }}>© 
            {/* dynamic year */}
            {new Date().getFullYear()} EduScan Pro. All rights reserved.</Text>
        </Row>
      </Footer>
    </Layout>
  );
};

export default Home;