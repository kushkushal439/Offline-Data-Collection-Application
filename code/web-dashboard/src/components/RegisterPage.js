import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_URL } from '../config';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is required',
    color: 'error'
  });

  // Calculate password strength
  const calculatePasswordStrength = (pass) => {
    if (!pass) {
      return { score: 0, message: 'Password is required', color: 'error' };
    }
    
    let score = 0;
    
    // Length check
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(pass)) score += 1; // Has uppercase
    if (/[a-z]/.test(pass)) score += 1; // Has lowercase
    if (/[0-9]/.test(pass)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Has special char
    
    // Map score to strength levels
    let strength = { score, color: 'error', message: 'Weak password' };
    
    if (score >= 3 && score < 5) {
      strength.color = 'warning';
      strength.message = 'Moderate password';
    } else if (score >= 5) {
      strength.color = 'success';
      strength.message = 'Strong password';
    }
    
    return strength;
  };

  // Update password strength when password changes
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/web_dashboard_users/register`, {
        Username: username,
        Email: email,
        Password: password
      }, { withCredentials: true });

      // Save user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      
      // Redirect to forms page
      navigate('/forms');
    } catch (error) {
      setError(
        error.response?.data?.message || "An error occurred during registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid container spacing={0} sx={{ height: isMobile ? 'auto' : '80vh', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
        {/* Left side - registration form */}
        <Grid item xs={12} md={6} sx={{ bgcolor: '#fff', p: 4, order: { xs: 2, md: 1 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              px: { xs: 2, sm: 4, md: 6 }
            }}
          >
            <Box sx={{ 
              bgcolor: theme.palette.primary.main, 
              color: 'white', 
              borderRadius: '50%', 
              p: 1.5,
              mb: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 56,
              height: 56
            }}>
              <PersonAddIcon fontSize="large" />
            </Box>
            
            <Typography 
              component="h1" 
              variant="h4" 
              fontWeight="bold" 
              gutterBottom
              sx={{ mb: 3 }}
            >
              Create Account
            </Typography>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': { 
                    alignItems: 'center' 
                  }
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box 
              component="form" 
              onSubmit={handleRegister} 
              sx={{ width: '100%', maxWidth: '400px' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderWidth: 2
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderWidth: 2
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={handlePasswordChange}
                sx={{ 
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderWidth: 2
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={password && passwordStrength.message}
                FormHelperTextProps={{
                  sx: { color: password ? theme.palette[passwordStrength.color].main : 'inherit' }
                }}
              />
              
              {/* Password strength indicator */}
              {password && (
                <Box sx={{ mb: 2, width: '100%', display: 'flex', gap: 0.5 }}>
                  {[...Array(6)].map((_, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        height: 4, 
                        flex: 1, 
                        borderRadius: 1,
                        bgcolor: index < passwordStrength.score 
                          ? theme.palette[passwordStrength.color].main 
                          : theme.palette.grey[300]
                      }} 
                    />
                  ))}
                </Box>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderWidth: 2
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VerifiedUserIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={password !== confirmPassword && confirmPassword !== ''}
                helperText={
                  password !== confirmPassword && confirmPassword !== '' 
                    ? 'Passwords do not match' 
                    : ''
                }
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                  mt: 1, 
                  mb: 3, 
                  py: 1.5, 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)',
                  }
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Already have an account?
                </Typography>
                <Link 
                  href="/login" 
                  variant="body1" 
                  underline="hover"
                  sx={{ fontWeight: 'medium' }}
                >
                  Sign in
                </Link>
              </Box>
            </Box>
          </Box>
        </Grid>
        
        {/* Right side - decorative - NOW BLUE */}
        <Grid item xs={12} md={6} 
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)', // Changed to blue
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            p: 6,
            position: 'relative',
            order: { xs: 1, md: 2 }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
              Join Us Today
            </Typography>
            
            <Box sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              p: 3, 
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              maxWidth: '400px',
              mb: 4
            }}>
              <Typography variant="h4">
                Anusandhan
              </Typography>
            </Box>
            
            {/* Benefits list */}
            <Box sx={{ textAlign: 'left', maxWidth: '400px' }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                What you'll get:
              </Typography>
              
              {[
                'Create and upload forms',
                'View Responses'
              ].map((benefit, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <Typography variant="body2" fontWeight="bold">
                      {index + 1}
                    </Typography>
                  </Box>
                  <Typography variant="body1">{benefit}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Decorative circles */}
          <Box sx={{ 
            position: 'absolute', 
            width: '300px', 
            height: '300px', 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.05)',
            top: '-100px',
            left: '-100px'
          }} />
          <Box sx={{ 
            position: 'absolute', 
            width: '200px', 
            height: '200px', 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.08)',
            bottom: '-50px',
            right: '-50px'
          }} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default RegisterPage;