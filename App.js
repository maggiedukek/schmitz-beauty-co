import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  TextInput,
  Alert,
} from 'react-native';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    interestedService: '',
    currentHairState: '',
    beautyGoals: '',
    inspirationPhotos: '',
    preferredDays: '',
    additionalNotes: '',
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitConsultation = () => {
    Alert.alert(
      'Consultation Submitted',
      'This is where you will later connect the form to your database or backend.'
    );
  };

  const renderHeader = () => (
    <View style={styles.topHeader}>
      <Image
        source={{ uri: 'https://i.imgur.com/WjfFLjt.png' }}
        style={styles.headerLogo}
        resizeMode="contain"
      />

      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => setCurrentScreen('account')}
      >
        <Text style={styles.accountButtonText}>Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHomeScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.redAccentLine} />
          <Text style={styles.heroEyebrow}>CONSULTATION FIRST</Text>
        </View>

        <Text style={styles.heroTitle}>
          A more thoughtful beauty experience.
        </Text>

        <Text style={styles.heroText}>
          Start with a consultation so service timing, hair goals, and the right
          appointment can be planned before booking.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentScreen('consult')}
        >
          <Text style={styles.primaryButtonText}>Begin Your Consultation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aboutCard}>
        <Image
          source={{ uri: 'https://i.imgur.com/c68mqDK.png' }}
          style={styles.aboutImage}
          resizeMode="cover"
        />

        <Text style={styles.aboutTitle}>Meet Brenna</Text>

        <Text style={styles.aboutText}>
          Brenna is the owner of Schmitz Beauty Co., where bold style meets
          elevated self-care. With a background in massage therapy and a passion
          for vivid color and precision lash work, she brings both artistry and
          intention to every service.
        </Text>

        <Text style={styles.aboutText}>
          Known for her edgy style and welcoming energy, Brenna has created a
          space that is inclusive, expressive, and unapologetically you. From
          nails and hair to waxing, facials, and lash extensions, she delivers
          high-end results with a personalized experience so every client leaves
          feeling confident, elevated, and completely themselves.
        </Text>
      </View>

      <View style={styles.servicesCard}>
        <Text style={styles.sectionTitle}>Signature Services</Text>

        <Text style={styles.sectionIntro}>
          A quick look at the beauty services offered at Schmitz Beauty Co.,
          designed to create a personalized, elevated experience from start to
          finish.
        </Text>

        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>Vivid Color</Text>
          <Text style={styles.serviceDescription}>
            Bold color work, custom tones, and expressive transformations.
          </Text>
        </View>

        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>Lash Extensions</Text>
          <Text style={styles.serviceDescription}>
            Precision lash work for a polished, elevated look.
          </Text>
        </View>

        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>Nails</Text>
          <Text style={styles.serviceDescription}>
            Detailed nail services designed to match your style and vibe.
          </Text>
        </View>

        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>Waxing</Text>
          <Text style={styles.serviceDescription}>
            Clean, smooth results in a comfortable and professional setting.
          </Text>
        </View>

        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>Facials</Text>
          <Text style={styles.serviceDescription}>
            Skin-focused treatments that refresh, restore, and elevate self-care.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentScreen('services')}
        >
          <Text style={styles.secondaryButtonText}>Explore Services</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderServicesScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.pageHeaderCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.redAccentLine} />
          <Text style={styles.heroEyebrow}>SERVICE MENU</Text>
        </View>

        <Text style={styles.pageTitle}>Services</Text>

        <Text style={styles.pageIntro}>
          Explore the signature beauty services offered at Schmitz Beauty Co.
        </Text>
      </View>

      <View style={styles.categoryCard}>
        <Text style={styles.categoryTitle}>Hair</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemName}>Vivid Color</Text>
          <Text style={styles.menuItemText}>
            Bold color transformations, expressive tones, and custom creative work.
          </Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemName}>Custom Color</Text>
          <Text style={styles.menuItemText}>
            Personalized color work tailored to your goals and maintenance needs.
          </Text>
        </View>
      </View>

      <View style={styles.categoryCard}>
        <Text style={styles.categoryTitle}>Lashes</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemName}>Lash Extensions</Text>
          <Text style={styles.menuItemText}>
            Precision lash services designed for a polished, elevated finish.
          </Text>
        </View>
      </View>

      <View style={styles.categoryCard}>
        <Text style={styles.categoryTitle}>Nails</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemName}>Nail Services</Text>
          <Text style={styles.menuItemText}>
            Detailed nail work designed to reflect your personal style.
          </Text>
        </View>
      </View>

      <View style={styles.categoryCard}>
        <Text style={styles.categoryTitle}>Skin + Waxing</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemName}>Waxing</Text>
          <Text style={styles.menuItemText}>
            Clean, smooth results in a comfortable professional setting.
          </Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemName}>Facials</Text>
          <Text style={styles.menuItemText}>
            Skin-focused treatments that refresh, restore, and elevate self-care.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentScreen('consult')}
      >
        <Text style={styles.secondaryButtonText}>Start Consultation</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConsultScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.pageHeaderCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.redAccentLine} />
          <Text style={styles.heroEyebrow}>CONSULTATION</Text>
        </View>

        <Text style={styles.pageTitle}>Begin Your Consultation</Text>

        <Text style={styles.pageIntro}>
          Fill out the details below so the right service, timing, and next step
          can be planned with intention.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#8A8A8A"
          value={formData.fullName}
          onChangeText={(text) => updateField('fullName', text)}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          placeholderTextColor="#8A8A8A"
          value={formData.phone}
          onChangeText={(text) => updateField('phone', text)}
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#8A8A8A"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
        />

        <Text style={styles.inputLabel}>Service You’re Interested In</Text>
        <TextInput
          style={styles.input}
          placeholder="Hair, lashes, nails, waxing, facials..."
          placeholderTextColor="#8A8A8A"
          value={formData.interestedService}
          onChangeText={(text) => updateField('interestedService', text)}
        />

        <Text style={styles.inputLabel}>Current Hair / Beauty Situation</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Tell us a little about your current hair, lashes, skin, nails, or any concerns..."
          placeholderTextColor="#8A8A8A"
          multiline
          value={formData.currentHairState}
          onChangeText={(text) => updateField('currentHairState', text)}
        />

        <Text style={styles.inputLabel}>What Are Your Goals?</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Describe the look, result, or experience you want..."
          placeholderTextColor="#8A8A8A"
          multiline
          value={formData.beautyGoals}
          onChangeText={(text) => updateField('beautyGoals', text)}
        />

        <Text style={styles.inputLabel}>Do You Have Inspiration Photos?</Text>
        <TextInput
          style={styles.input}
          placeholder="Yes / No / Can send later"
          placeholderTextColor="#8A8A8A"
          value={formData.inspirationPhotos}
          onChangeText={(text) => updateField('inspirationPhotos', text)}
        />

        <Text style={styles.inputLabel}>Preferred Days or Times</Text>
        <TextInput
          style={styles.input}
          placeholder="Weekdays, evenings, flexible, etc."
          placeholderTextColor="#8A8A8A"
          value={formData.preferredDays}
          onChangeText={(text) => updateField('preferredDays', text)}
        />

        <Text style={styles.inputLabel}>Anything Else Brenna Should Know?</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Add anything important here..."
          placeholderTextColor="#8A8A8A"
          multiline
          value={formData.additionalNotes}
          onChangeText={(text) => updateField('additionalNotes', text)}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={submitConsultation}
        >
          <Text style={styles.primaryButtonText}>Submit Consultation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPortfolioScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.pageHeaderCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.redAccentLine} />
          <Text style={styles.heroEyebrow}>PORTFOLIO</Text>
        </View>

        <Text style={styles.pageTitle}>Portfolio</Text>
        <Text style={styles.pageIntro}>
          This page can later show featured work, transformations, and finished results.
        </Text>
      </View>
    </ScrollView>
  );

  const renderAccountScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.pageHeaderCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.redAccentLine} />
          <Text style={styles.heroEyebrow}>ACCOUNT</Text>
        </View>

        <Text style={styles.pageTitle}>Account</Text>
        <Text style={styles.pageIntro}>
          This page can later hold client login, stylist login, and saved account details.
        </Text>
      </View>
    </ScrollView>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'services':
        return renderServicesScreen();
      case 'consult':
        return renderConsultScreen();
      case 'portfolio':
        return renderPortfolioScreen();
      case 'account':
        return renderAccountScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={{ uri: 'https://i.imgur.com/E5xYmC9.png' }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          {renderHeader()}
          {renderCurrentScreen()}

          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('home')}
            >
              <Text
                style={[
                  styles.navText,
                  currentScreen === 'home' && styles.navTextActive,
                ]}
              >
                Home
              </Text>
              {currentScreen === 'home' && <View style={styles.activeUnderline} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('services')}
            >
              <Text
                style={[
                  styles.navText,
                  currentScreen === 'services' && styles.navTextActive,
                ]}
              >
                Services
              </Text>
              {currentScreen === 'services' && <View style={styles.activeUnderline} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('portfolio')}
            >
              <Text
                style={[
                  styles.navText,
                  currentScreen === 'portfolio' && styles.navTextActive,
                ]}
              >
                Portfolio
              </Text>
              {currentScreen === 'portfolio' && <View style={styles.activeUnderline} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCurrentScreen('account')}
            >
              <Text
                style={[
                  styles.navText,
                  currentScreen === 'account' && styles.navTextActive,
                ]}
              >
                Account
              </Text>
              {currentScreen === 'account' && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,186,181,0.22)',
  },
  headerLogo: {
    width: 150,
    height: 60,
  },
  accountButton: {
    backgroundColor: '#0ABAB5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 96,
  },

  heroCard: {
    backgroundColor: 'rgba(0,0,0,0.84)',
    borderRadius: 26,
    padding: 26,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.82)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  aboutCard: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.78)',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  servicesCard: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.78)',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  pageHeaderCard: {
    backgroundColor: 'rgba(0,0,0,0.84)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.78)',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  categoryCard: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.78)',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  formCard: {
    backgroundColor: 'rgba(0,0,0,0.84)',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.78)',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  redAccentLine: {
    width: 18,
    height: 2,
    backgroundColor: '#B3261E',
    marginRight: 10,
    borderRadius: 99,
  },
  heroEyebrow: {
    color: '#0ABAB5',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 31,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginBottom: 14,
  },
  heroText: {
    color: '#F0F0F0',
    marginBottom: 24,
    lineHeight: 25,
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor: '#0ABAB5',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
  },

  aboutImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
  },
  aboutTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginBottom: 10,
  },
  aboutText: {
    color: '#EAEAEA',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginRight: 12,
  },
  sectionIntro: {
    color: '#EAEAEA',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },

  serviceItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  serviceName: {
    color: '#0ABAB5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  serviceDescription: {
    color: '#EAEAEA',
    fontSize: 14,
    lineHeight: 22,
  },

  secondaryButton: {
    marginTop: 18,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.82)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  pageTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginBottom: 10,
  },
  pageIntro: {
    color: '#EAEAEA',
    fontSize: 15,
    lineHeight: 24,
  },

  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginBottom: 14,
  },
  menuItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  menuItemName: {
    color: '#0ABAB5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  menuItemText: {
    color: '#EAEAEA',
    fontSize: 14,
    lineHeight: 22,
  },

  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(179,38,30,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,186,181,0.22)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  navText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#0ABAB5',
    fontSize: 13,
    fontWeight: '700',
  },
  activeUnderline: {
    marginTop: 4,
    width: 16,
    height: 2,
    backgroundColor: '#B3261E',
    borderRadius: 99,
  },
});
