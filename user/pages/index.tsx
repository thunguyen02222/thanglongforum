import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/home', permanent: false }
});

export default function IndexPage() {
  return null;
}
