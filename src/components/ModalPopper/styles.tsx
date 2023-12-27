import {StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
  },
  modalInner: {
    backgroundColor: colors.white,
    width: '65%',
    height: '100%',
  },
});

export default styles;
