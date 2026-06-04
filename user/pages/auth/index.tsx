import { GetServerSideProps } from 'next';

export default function AuthIndexPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/auth/login',
      permanent: false
    }
  };
};

