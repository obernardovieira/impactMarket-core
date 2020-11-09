import { should } from 'chai';

import {
    ImpactMarketInstance,
    CommunityInstance,
    CUSDInstance,
    CommunityFactoryInstance,
} from '../../../types/truffle-contracts';
import { defineAccounts } from '../../helpers/accounts';
import {
    hour,
    day,
    claimAmountTwo,
    maxClaimTen,
} from '../../helpers/constants';
import {
    ImpactMarket,
    Community,
    CommunityFactory,
    cUSD,
} from '../../helpers/contracts';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert } = require('@openzeppelin/test-helpers');
should();

/** @test {Community} contract */
contract('ImpactMarket - Basic', async (accounts) => {
    const { adminAccount1, communityManagerA } = defineAccounts(accounts);
    // contract instances
    let impactMarketInstance: ImpactMarketInstance;
    let communityInstance: CommunityInstance;
    let communityFactoryInstance: CommunityFactoryInstance;
    let cUSDInstance: CUSDInstance;

    beforeEach(async () => {
        cUSDInstance = await cUSD.new();
        impactMarketInstance = await ImpactMarket.new(cUSDInstance.address, [
            adminAccount1,
        ]);
        communityFactoryInstance = await CommunityFactory.new(
            cUSDInstance.address,
            impactMarketInstance.address
        );
        await impactMarketInstance.setCommunityFactory(
            communityFactoryInstance.address
        );
    });

    it('should be able to add a community if admin', async () => {
        const tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        const communityManagerAddress = tx.logs[2].args[0];
        communityInstance = await Community.at(communityManagerAddress);
        (await communityInstance.claimAmount())
            .toString()
            .should.be.equal(claimAmountTwo.toString());
        (await communityInstance.baseInterval())
            .toString()
            .should.be.equal('86400');
        (await communityInstance.incrementInterval())
            .toString()
            .should.be.equal('3600');
        (await communityInstance.maxClaim())
            .toString()
            .should.be.equal(maxClaimTen.toString());
    });

    it('should be able to remove a community if admin', async () => {
        const tx = await impactMarketInstance.addCommunity(
            communityManagerA,
            claimAmountTwo.toString(),
            maxClaimTen.toString(),
            day,
            hour,
            { from: adminAccount1 }
        );
        const communityManagerAddress = tx.logs[2].args[0];
        await impactMarketInstance.removeCommunity(communityManagerAddress, {
            from: adminAccount1,
        });
    });

    it('should not be able to create a community with invalid values', async () => {
        await expectRevert.unspecified(
            impactMarketInstance.addCommunity(
                communityManagerA,
                claimAmountTwo.toString(),
                maxClaimTen.toString(),
                hour,
                day,
                { from: adminAccount1 }
            )
        );
        await expectRevert.unspecified(
            impactMarketInstance.addCommunity(
                communityManagerA,
                maxClaimTen.toString(), // it's supposed to be wrong!
                claimAmountTwo.toString(),
                day,
                hour,
                { from: adminAccount1 }
            )
        );
    });
});
